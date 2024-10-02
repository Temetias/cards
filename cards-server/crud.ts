import type { DB } from "https://deno.land/x/sqlite@v3.9.0/mod.ts";
import type { Handler } from "@std/http/unstable-route";

export type Entity<T extends object = object> = T & {
  /**
   * V4 UUID
   */
  id: string;
  /**
   * ISO 8601
   */
  createdAt: string;
  /**
   * ISO 8601
   */
  updatedAt: string;
  //createdBy: string;
  //updatedBy: string;
};

export type ReadEntityFunction<T extends Entity> = (
  db: DB,
  id: string
) => T | undefined;

export class CrudResponse extends Response {
  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super(body, init);
    this.headers.set("Access-Control-Allow-Origin", "*");
    this.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    this.headers.set("Access-Control-Allow-Headers", "Origin, Content-Type");
  }
}

export function readHandler<T extends Entity>(
  db: DB,
  fn: ReadEntityFunction<T>
): Handler {
  return (_req, _info, params) => {
    const id = params?.pathname.groups.id;
    if (!id) {
      return new CrudResponse("Missing parameter 'id'", { status: 400 });
    }
    const entity = fn(db, id);
    if (!entity) {
      return new CrudResponse("Entity not found", { status: 404 });
    }
    return new CrudResponse(JSON.stringify(entity), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  };
}

export type ReadAllEntityFunction<T extends Entity> = (db: DB) => T[];

export function readAllHandler<T extends Entity>(
  db: DB,
  fn: ReadAllEntityFunction<T>
): Handler {
  return (_req, _info) => {
    const entities = fn(db);
    return new CrudResponse(JSON.stringify(entities), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  };
}

export type CreateInputEntity<T extends Entity> = Omit<
  T,
  "id" | "createdAt" | "updatedAt"
>;

export type CreateOutputEntity<T extends Entity> = T;

export type CreateEntityFunction<T extends Entity> = (
  db: DB,
  entity: CreateInputEntity<T>
) => CreateOutputEntity<T>;

export function createHandler<T extends Entity>(
  db: DB,
  fn: CreateEntityFunction<T>
): Handler {
  return async (req) => {
    const entity = await req.json();
    const createdEntity = fn(db, entity);
    return new CrudResponse(JSON.stringify(createdEntity), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 201,
    });
  };
}
export type UpdateInputEntity<T extends Entity> = Partial<
  Omit<T, "createdAt" | "updatedAt">
>;

export type UpdateOutputEntity<T extends Entity> = T;

export type UpdateEntityFunction<T extends Entity> = (
  db: DB,
  id: string,
  entity: UpdateInputEntity<T>
) => UpdateOutputEntity<T> | undefined;

export function updateHandler<T extends Entity>(
  db: DB,
  fn: UpdateEntityFunction<T>
): Handler {
  return async (req, _info, params) => {
    const id = params?.pathname.groups.id;
    if (!id) {
      return new CrudResponse("Missing parameter 'id'", { status: 400 });
    }
    const entity = await req.json();
    const updatedEntity = fn(db, id, entity);
    if (!updatedEntity) {
      return new CrudResponse("Entity not found", { status: 404 });
    }
    return new CrudResponse(JSON.stringify(updatedEntity), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  };
}

export type DeleteOutputEntity<T extends Entity> = Omit<T, "id">;

export type DeleteEntityFunction<T extends Entity> = (
  db: DB,
  id: string
) => DeleteOutputEntity<T> | undefined;

export function deleteHandler<T extends Entity>(
  db: DB,
  fn: DeleteEntityFunction<T>
): Handler {
  return (_req, _info, params) => {
    const id = params?.pathname.groups.id;
    if (!id) {
      return new CrudResponse("Missing parameter 'id'", { status: 400 });
    }
    const deletedEntity = fn(db, id);
    if (!deletedEntity) {
      return new CrudResponse("Entity not found", { status: 404 });
    }
    return new CrudResponse(JSON.stringify(deletedEntity), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  };
}
