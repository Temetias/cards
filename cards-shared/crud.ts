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
