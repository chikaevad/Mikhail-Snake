export type UpdateDbRow<T> = Partial<Omit<T, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
