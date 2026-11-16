"use client";

import { useEffect, useState } from "react";
import { Search, Shapes } from "lucide-react";
import toast from "react-hot-toast";

import {
  useAddons,
  useAddon,
  useCreateAddon,
  useUpdateAddon,
  useDeleteAddon,
} from "@/hooks/useAddons";

import type {
  Addon,
  CreateAddonPayload,
  UpdateAddonPayload,
} from "@/lib/types/addons";

import AddonTable from "@/components/settingsComponents/addons/AddonTable";
import EditAddonModal, {
  type AddonFormValues,
} from "@/components/settingsComponents/addons/EditAddonModal";

import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import HeaderActionButton from "@/components/ui/HeaderActionButton";
import PageHeader from "@/components/ui/PageHeader";

const emptyForm: AddonFormValues = {
  name: "",
  price: 0,
  description: "",
  maxAvailable: undefined,
};

export default function AddonSettingsPage() {
  const { data: addons = [], isLoading } = useAddons();

  const { mutate: createAddon, isPending: creating } = useCreateAddon();
  const { mutate: updateAddon, isPending: updating } = useUpdateAddon();
  const { mutate: deleteAddon, isPending: deleting } = useDeleteAddon();

  const [search, setSearch] = useState("");

  // Create/Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Addon | null>(null);
  const [form, setForm] = useState<AddonFormValues>(emptyForm);

  // Fetch selected add-on when editing
  const {
    data: selectedAddon,
    isLoading: loadingAddon,
    isError: addonFetchError,
  } = useAddon(editTarget?._id ?? "", modalOpen && !!editTarget);

  useEffect(() => {
    if (!selectedAddon || !editTarget) return;

    setEditTarget(selectedAddon);

    setForm({
      name: selectedAddon.name,
      price: selectedAddon.price,
      description: selectedAddon.description ?? "",
      maxAvailable: selectedAddon.maxAvailable,
    });
  }, [selectedAddon, editTarget]);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState("");

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (addon: Addon) => {
    setEditTarget(addon);

    // Show existing list values while the individual GET request loads.
    setForm({
      name: addon.name,
      price: addon.price,
      description: addon.description ?? "",
      maxAvailable: addon.maxAvailable,
    });

    setModalOpen(true);
  };

  const openDelete = (id: string) => {
    const target = addons.find((addon) => addon._id === id);
    if (!target) return;

    setDeleteTargetId(id);
    setDeleteTargetName(target.name);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return;

    deleteAddon(deleteTargetId, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setDeleteTargetId(null);
        setDeleteTargetName("");
      },
    });
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Please enter an add-on name");
      return;
    }

    if (!Number.isFinite(form.price) || form.price < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const payload = {
      name: form.name.trim(),
      price: form.price,
      description: form.description.trim() || undefined,
      maxAvailable: form.maxAvailable,
    };

    if (editTarget) {
      const updatePayload: UpdateAddonPayload = {
        _id: editTarget._id,
        ...payload,
      };

      updateAddon(updatePayload, {
        onSuccess: () => {
          setModalOpen(false);
          setEditTarget(null);
        },
      });
    } else {
      const createPayload: CreateAddonPayload = payload;

      createAddon(createPayload, {
        onSuccess: () => {
          setModalOpen(false);
          setForm({ ...emptyForm });
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-surface-page px-6 py-5 sm:py-8 md:px-10 dark:bg-[#0f1420]">
      <div className="mx-auto w-full space-y-6">
        {/* Header */}
        <PageHeader
          title="Add-on Settings"
          subtitle={<>{addons.length} add-ons configured</>}
          spaceBelow={false}
          actions={
            <HeaderActionButton
              variant="dashed"
              icon={Shapes}
              hideLabelOnMobile
              label="New Add-on"
              onClick={openCreate}
            />
          }
        />

        {/* Search */}
        <div className="relative mb-8 mt-6">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#7b869b]"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search add-ons..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-[13px] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4] dark:placeholder:text-[#7b869b]"
          />
        </div>

        {/* Add-on Table */}
        <div className="rounded-xl bg-white px-5 dark:bg-[#0F1420]">
          <AddonTable
            addons={addons}
            search={search}
            onEdit={openEdit}
            onDelete={openDelete}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      <EditAddonModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);

          if (!open) {
            setEditTarget(null);
            setForm({ ...emptyForm });
          }
        }}
        editTarget={editTarget}
        form={form}
        onFormChange={setForm}
        onSave={handleSave}
        isPending={creating || updating}
        isLoading={!!editTarget && loadingAddon}
      />

      {/* Edit fetch error */}
      {addonFetchError && modalOpen && editTarget && (
        <div className="sr-only" role="alert">
          Failed to load add-on details.
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteModalOpen(false);
            setDeleteTargetId(null);
            setDeleteTargetName("");
          }
        }}
        icon={Shapes}
        title="Delete add-on?"
        description={
          deleteTargetName
            ? `“${deleteTargetName}” will be permanently removed.`
            : "This add-on will be permanently removed."
        }
        warning="This action cannot be undone."
        onConfirm={confirmDelete}
        isPending={deleting}
      />
    </div>
  );
}
