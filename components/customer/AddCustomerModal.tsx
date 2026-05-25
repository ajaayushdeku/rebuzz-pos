// components/AddCustomerModal.tsx
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { useCreateCustomer } from "@/hooks/useCustomers";
import { useUIStore } from "@/stores/useUIStore";

// Validation schema
const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

// export default function AddCustomerModal() {
//   const {
//     isCustomerModalOpen,
//     closeCustomerModal,
//   } = useUIStore();
//   const createCustomerMutation =
//     useCreateCustomer();
//   const [additionalPhones, setAdditionalPhones] =
//     React.useState<string[]>([]);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//     reset,
//   } = useForm<CustomerFormData>({
//     resolver: zodResolver(customerSchema),
//     defaultValues: {
//       name: "",
//       firstName: "",
//       lastName: "",
//       email: "",
//       phone: "",
//     },
//   });

//   const onSubmit = async (
//     data: CustomerFormData,
//   ) => {
//     try {
//       await createCustomerMutation.mutateAsync(
//         data,
//       );

//       // Close modal and reset form
//       closeCustomerModal();
//       reset();
//       setAdditionalPhones([]);
//     } catch (error) {
//       console.error(
//         "Failed to create customer:",
//         error,
//       );
//     }
//   };

//   const handleClose = () => {
//     closeCustomerModal();
//     reset();
//     setAdditionalPhones([]);
//   };

//   const addPhoneField = () => {
//     setAdditionalPhones([
//       ...additionalPhones,
//       "",
//     ]);
//   };

//   return (
//     <Dialog
//       open={isCustomerModalOpen}
//       onOpenChange={handleClose}
//     >
//       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-3xl font-bold">
//             New customer
//           </DialogTitle>
//         </DialogHeader>

//         <form
//           onSubmit={handleSubmit(onSubmit)}
//           className="space-y-8 mt-6"
//         >
//           {/* Basic Information */}
//           <div>
//             <h3 className="text-xl font-semibold mb-6">
//               Basic information
//             </h3>

//             <div className="space-y-6">
//               {/* Customer Name */}
//               <div className="grid grid-cols-3 gap-4 items-start">
//                 <Label
//                   htmlFor="name"
//                   className="text-right pt-3 text-gray-700"
//                 >
//                   Customer
//                   <span className="text-red-500">
//                     *
//                   </span>
//                 </Label>
//                 <div className="col-span-2">
//                   <Input
//                     id="name"
//                     {...register("name")}
//                     className={
//                       errors.name
//                         ? "border-red-500"
//                         : ""
//                     }
//                     placeholder=""
//                   />
//                   {errors.name && (
//                     <p className="text-sm text-red-500 mt-1">
//                       {errors.name.message}
//                     </p>
//                   )}
//                   <p className="text-sm text-gray-500 mt-2">
//                     Name of a business or person.
//                   </p>
//                 </div>
//               </div>

//               {/* Primary Contact */}
//               <div className="grid grid-cols-3 gap-4 items-start">
//                 <Label className="text-right pt-3 text-gray-700">
//                   Primary contact
//                 </Label>
//                 <div className="col-span-2 bg-gray-50 p-6 rounded-lg space-y-4">
//                   {/* First Name */}
//                   <div>
//                     <Label
//                       htmlFor="firstName"
//                       className="text-sm text-gray-600 mb-2 block"
//                     >
//                       First name
//                     </Label>
//                     <Input
//                       id="firstName"
//                       {...register("firstName")}
//                       placeholder=""
//                     />
//                   </div>

//                   {/* Last Name */}
//                   <div>
//                     <Label
//                       htmlFor="lastName"
//                       className="text-sm text-gray-600 mb-2 block"
//                     >
//                       Last name
//                     </Label>
//                     <Input
//                       id="lastName"
//                       {...register("lastName")}
//                       placeholder=""
//                     />
//                   </div>

//                   {/* Email */}
//                   <div>
//                     <Label
//                       htmlFor="email"
//                       className="text-sm text-gray-600 mb-2 block"
//                     >
//                       Email
//                     </Label>
//                     <Input
//                       id="email"
//                       type="email"
//                       {...register("email")}
//                       className={
//                         errors.email
//                           ? "border-red-500"
//                           : ""
//                       }
//                       placeholder=""
//                     />
//                     {errors.email && (
//                       <p className="text-sm text-red-500 mt-1">
//                         {errors.email.message}
//                       </p>
//                     )}
//                   </div>

//                   {/* Phone */}
//                   <div>
//                     <Label
//                       htmlFor="phone"
//                       className="text-sm text-gray-600 mb-2 block"
//                     >
//                       Phone
//                     </Label>
//                     <Input
//                       id="phone"
//                       type="tel"
//                       {...register("phone")}
//                       placeholder=""
//                     />
//                   </div>

//                   {/* Additional Phone Fields */}
//                   {additionalPhones.map(
//                     (_, index) => (
//                       <div key={index}>
//                         <Label className="text-sm text-gray-600 mb-2 block">
//                           Phone {index + 2}
//                         </Label>
//                         <Input
//                           type="tel"
//                           placeholder=""
//                           value={
//                             additionalPhones[
//                               index
//                             ]
//                           }
//                           onChange={(e) => {
//                             const newPhones = [
//                               ...additionalPhones,
//                             ];
//                             newPhones[index] =
//                               e.target.value;
//                             setAdditionalPhones(
//                               newPhones,
//                             );
//                           }}
//                         />
//                       </div>
//                     ),
//                   )}

//                   {/* Add Phone Button */}
//                   <Button
//                     type="button"
//                     variant="link"
//                     onClick={addPhoneField}
//                     className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
//                   >
//                     <Plus className="h-4 w-4 mr-1" />
//                     Add phone
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Form Actions */}
//           <div className="flex justify-end gap-3 pt-6 border-t">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={handleClose}
//               disabled={isSubmitting}
//             >
//               Cancel
//             </Button>
//             <Button
//               type="submit"
//               disabled={isSubmitting}
//               className="bg-blue-600 hover:bg-blue-700"
//             >
//               {isSubmitting
//                 ? "Creating..."
//                 : "Create customer"}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }
export default function AddCusotmerModal() {
  return <div></div>;
}
