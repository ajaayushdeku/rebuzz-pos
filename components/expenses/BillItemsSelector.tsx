import { useState } from "react";
import { TableCell, TableRow } from "../ui/table";
import {
  Check,
  ChevronsUpDown,
  CirclePlus,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { ProductService } from "./products-services/productservice-columns";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";

export interface BillItem {
  id: string;
  productId: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
}

export interface BillItemsSelectorProps {
  products: ProductService[];
  items: BillItem[];
  onItemsChange: (items: BillItem[]) => void;
}

export default function BillItemsSelector({
  items,
  products,
  onItemsChange,
}: BillItemsSelectorProps) {
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [isLoading, setIsLoading] =
    useState(false);
  const [search, setSearch] = useState("");
  const [activeRowId, setActiveRowId] = useState<
    string | null
  >(null);

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    description: "",
    type: "Product",
  });

  const resetModalFields = () => {
    setNewProduct({
      name: "",
      price: 0,
      description: "",
      type: "Product",
    });
    setSearch("");
  };

  const openCreateModal = (
    rowId: string,
    name: string,
  ) => {
    setActiveRowId(rowId);
    setNewProduct((prev) => ({ ...prev, name }));
    setIsModalOpen(true);
  };

  const handleProductSelect = (
    itemId: string,
    productName: string,
  ) => {
    const product = products.find(
      (p) => p.name === productName,
    );

    onItemsChange(
      items.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          name: productName,
          productId: product?.id ?? "",
          price: product?.price ?? 0,
          description: product?.description ?? "",
        };
      }),
    );
  };

  const addItem = () => {
    onItemsChange([
      ...items,
      {
        id: crypto.randomUUID(),
        productId: "",
        name: "",
        description: "",
        quantity: 1,
        price: 0,
      },
    ]);
  };

  const updateItem = (
    id: string,
    field: keyof BillItem,
    value: string | number,
  ) => {
    onItemsChange(
      items.map((item) => {
        if (item.id !== id) return item;
        return { ...item, [field]: value };
      }),
    );
  };
  return (
    <>
      {items.map((item, idx) => (
        <TableRow
          key={idx}
          className="border-b-0"
        >
          <TableCell className="w-6 px-1">
            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
          </TableCell>

          <TableCell className="min-w-50">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between font-normal border-gray-300",
                    !item.name &&
                      "text-muted-foreground",
                  )}
                >
                  {item.name ||
                    "Select product..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-75 p-0"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder="Search product..."
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList>
                    <CommandEmpty className="p-0">
                      <div className="py-6 text-center text-sm">
                        No product found.
                      </div>
                      <Button
                        variant="secondary"
                        className="w-full rounded-none border-t flex items-center justify-start gap-2 px-4 py-2"
                        onClick={() =>
                          openCreateModal(
                            item.id,
                            search,
                          )
                        }
                      >
                        <Plus className="h-4 w-4" />
                        <span>
                          Create &quot;{search}
                          &quot;
                        </span>
                      </Button>
                    </CommandEmpty>
                    <CommandGroup>
                      {products.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={product.name}
                          onSelect={() =>
                            handleProductSelect(
                              item.id,
                              product.name,
                            )
                          }
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              item.name ===
                                product.name
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col">
                            <span>
                              {product.name}
                            </span>

                            <span className="text-xs text-muted-foreground">
                              ${product.price}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </TableCell>

          <TableCell className="min-w-48">
            <Input
              value={item.description}
              onChange={(e) =>
                updateItem(
                  item.id,
                  "description",
                  e.target.value,
                )
              }
              placeholder="Description"
            />
          </TableCell>
          <TableCell className="w-24">
            <Input
              type="number"
              value={item.quantity}
              onChange={(e) =>
                updateItem(
                  item.id,
                  "quantity",
                  Number(e.target.value),
                )
              }
              className="text-right"
            />
          </TableCell>
          <TableCell className="w-24">
            <Input
              type="number"
              value={item.price}
              onChange={(e) =>
                updateItem(
                  item.id,
                  "price",
                  Number(e.target.value),
                )
              }
              className="text-right"
            />
          </TableCell>
          <TableCell className="w-24 text-right font-medium">
            $
            {(() => {
              const rowSubtotal =
                item.quantity * item.price;
              return rowSubtotal.toFixed(2);
            })()}
          </TableCell>
          <TableCell className="w-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                onItemsChange(
                  items.filter(
                    (i) => i.id !== item.id,
                  ),
                )
              }
            >
              <Trash2 className="h-4 w-4 text-blue-500 hover:text-red-500" />
            </Button>
          </TableCell>
        </TableRow>
      ))}
      <TableRow className="bg-blue-50/30 hover:bg-blue-50/50">
        <TableCell colSpan={7}>
          <button
            onClick={addItem}
            className="flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors px-4 py-2"
          >
            <CirclePlus className="h-4 w-4" />
            Add an item
          </button>
        </TableCell>
      </TableRow>

      {/* Modal for creating new product */}
      <Dialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-blue-600">
              Create New Product or Service
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Product Name
              </Label>
              <Input
                id="name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    price: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">
                Description
              </Label>
              <Input
                id="description"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setIsModalOpen(false)
              }
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              //   onClick={handleSaveProduct}
              disabled={isLoading}
            >
              {isLoading
                ? "Saving..."
                : "Save Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
