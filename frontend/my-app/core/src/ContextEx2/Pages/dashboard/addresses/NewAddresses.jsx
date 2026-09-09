import React, { useState, useRef, useEffect, useCallback } from "react";
import { Modal, Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Manually from "./Manually";
import Notification from "../../../Components/feature/Notification";
import { useLanguage } from "../../../Context/LanguageContext";

export default function NewAddresses({
  open,
  onClose,
  onSave,
  editingAddress,
  saving = false
}) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const notificationRef = useRef();

  useEffect(() => {
    if (open && editingAddress) {
      setIsEditing(true);
      setEditingId(editingAddress.id);
    } else if (!open) {
      setIsEditing(false);
      setEditingId(null);
    }
  }, [open, editingAddress]);

  const handleSaveAddress = useCallback(
    (addressData) => {
      onSave(addressData, isEditing, editingId);
    },
    [editingId, isEditing, onSave]
  );

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="address-modal-title"
      >
        <Box
          className="mod-box mod-special"
          sx={{
            background: "linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.98))",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "16px",
            boxShadow: "0 24px 48px rgba(0, 0, 0, 0.6)",
            maxWidth: "650px",
            width: "90%",
            p: { xs: 2.5, sm: 4 },
            color: "#fff",
            maxHeight: "90vh",
            overflowY: "auto"
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              pb: 1.5,
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              sx={{ fontWeight: "700", color: "#fff" }}
            >
              {isEditing ? `✏️ ${t("common.edit", "Edit Address")}` : `📍 ${t("dashboard.addNewAddress", "Add New Address")}`}
            </Typography>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                "&:hover": { color: "#fff", bgcolor: "rgba(255, 255, 255, 0.1)" }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Form */}
          <Manually
            notificationRef={notificationRef}
            onSave={handleSaveAddress}
            editingAddress={editingAddress}
            isEditing={isEditing}
            onCancel={onClose}
            saving={saving}
          />
        </Box>
      </Modal>

      <Notification ref={notificationRef} />
    </>
  );
}
