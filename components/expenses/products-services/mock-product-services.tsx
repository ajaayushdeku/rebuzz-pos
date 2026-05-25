import { ProductService } from "./productservice-columns";

export const mockProductService: ProductService[] =
  [
    {
      type: "Product",
      id: "1",
      name: "Gas",
      description: "Petrol for truck",
      price: 50,
    },
    {
      type: "Service",
      id: "2",
      name: "Oil change",
      description: "Oil change for the truck",
      price: 20,
    },
  ];
