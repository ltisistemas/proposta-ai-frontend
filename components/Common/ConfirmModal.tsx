"use client";

import React, { useState } from "react";
import { Trash2, AlertTriangle, Info } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar ação",
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  isLoading: externalLoading = false,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading || internalLoading;
  const isMountedRef = React.useRef(true);
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      if (isMountedRef.current) {
        setInternalLoading(false);
      }
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-rose-50 dark:bg-[#ff5555]/15 border-rose-100 dark:border-[#ff5555]/30 text-rose-600 dark:text-[#ff5555]",
          icon: <Trash2 className="w-6 h-6" />,
          buttonVariant: "danger" as const,
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 dark:bg-[#ffb86c]/15 border-amber-100 dark:border-[#ffb86c]/30 text-amber-600 dark:text-[#ffb86c]",
          icon: <AlertTriangle className="w-6 h-6" />,
          buttonVariant: "primary" as const,
        };
      default:
        return {
          iconBg: "bg-blue-50 dark:bg-[#8be9fd]/15 border-blue-100 dark:border-[#8be9fd]/30 text-blue-600 dark:text-[#8be9fd]",
          icon: <Info className="w-6 h-6" />,
          buttonVariant: "primary" as const,
        };
    }
  };

  const currentVariant = getVariantStyles();

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      size="sm"
      hideDefaultCloseButton={isLoading}
    >
      <div className="flex flex-col items-center text-center p-2 sm:p-3">
        {/* Icon Badge */}
        <div
          className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4.5 ${currentVariant.iconBg} shadow-xs animate-in zoom-in-90 duration-150`}
        >
          {currentVariant.icon}
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-black text-slate-900 dark:text-[#f8f8f2] tracking-tight mb-2">
          {title}
        </h3>

        {description && (
          <div className="text-sm text-slate-500 dark:text-[#cbd5e1] leading-relaxed mb-6 max-w-sm">
            {description}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 w-full mt-2">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 font-semibold"
          >
            {cancelLabel}
          </Button>

          <Button
            variant={currentVariant.buttonVariant}
            size="md"
            onClick={handleConfirm}
            isLoading={isLoading}
            className="flex-1 font-bold shadow-sm"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
