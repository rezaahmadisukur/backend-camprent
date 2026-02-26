export type TProduct = {
  id?: string | undefined;
  name?: string | undefined;
  stock?: number | undefined;
  price: number | undefined;
  imageUrl?: string | null;
  description?: string | null;
  category?:
    | {
        id: string;
        name: string;
      }
    | undefined;
};

// price: number | undefined; name?: string | undefined; id?: string | undefined; description?: string | null | undefined; imageUrl?: string | null | undefined; stock?: number | undefined; category?: { ...; } | undefined;

export type TCreateProduct = {
  id: string;
  name: string;
  stock: number;
  price: Decimal;
  imageUrl: string | null;
  description: string | null;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
};
