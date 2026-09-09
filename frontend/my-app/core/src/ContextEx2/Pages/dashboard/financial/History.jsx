import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  IconButton,
  Collapse
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import OrderService from "../../../Services/OrderService";
import { useLanguage } from "../../../Context/LanguageContext";
import { formatPrice } from "../../../utils/formatPrice";
import { ppic14 } from "../../../Constants";

import "../../../Styles/components/History.css";

const STATUS_CONFIG = {
  DELIVERED: { label: "Delivered", color: "#4caf50", bg: "rgba(76, 175, 80, 0.15)" },
  SHIPPED: { label: "Shipped", color: "#ab47bc", bg: "rgba(171, 71, 188, 0.15)" },
  PROCESSING: { label: "Processing", color: "#29b6f6", bg: "rgba(41, 182, 246, 0.15)" },
  PENDING: { label: "Pending Payment", color: "#ffa726", bg: "rgba(255, 167, 38, 0.15)" },
  CANCELLED: { label: "Cancelled", color: "#ef5350", bg: "rgba(239, 83, 80, 0.15)" },
  REFUNDED: { label: "Refunded", color: "#78909c", bg: "rgba(120, 144, 156, 0.15)" }
};

export default function History() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await OrderService.getOrders();
        const list = response.data?.results || response.data || [];
        setOrders(list);
        // Automatically expand the latest order if available
        if (list.length > 0) {
          setExpandedOrderId(list[0].id);
        }
      } catch (err) {
        console.error("Failed loading orders:", err);
        setError("Could not load order history.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const toggleExpand = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "#d17842" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: "center", color: "#ef5350" }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  if (orders.length === 0) {
    return (
      <Box
        sx={{
          p: 6,
          textAlign: "center",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px dashed rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          my: 2
        }}
      >
        <Inventory2Icon sx={{ fontSize: 56, color: "rgba(255, 255, 255, 0.3)", mb: 1.5 }} />
        <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
          {t("dashboard.noOrders", "No orders yet")}
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
          {t("cart.emptySubtitle", "Your completed purchases and book orders will appear here.")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="orders-history-list">
      {orders.map((order) => {
        const isExpanded = expandedOrderId === order.id;
        const statusMeta = STATUS_CONFIG[order.status] || {
          label: order.status_display || order.status,
          color: "#aaa",
          bg: "rgba(255, 255, 255, 0.1)"
        };
        const hasShipping = Boolean(order.shipping_name || order.shipping_address_line1);

        return (
          <Box
            key={order.id}
            className={`order-history-card ${isExpanded ? "expanded" : ""}`}
          >
            {/* Header / Clickable summary row */}
            <Box
              className="order-card-header"
              onClick={() => toggleExpand(order.id)}
            >
              <Box className="order-header-left">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#fff" }}>
                    {t("dashboard.orderPlaced", "Order #{id}", { id: order.id })}
                  </Typography>
                  <Chip
                    label={t("common.status_" + (order.status || "").toLowerCase(), statusMeta.label)}
                    size="small"
                    sx={{
                      bgcolor: statusMeta.bg,
                      color: statusMeta.color,
                      border: `1px solid ${statusMeta.color}50`,
                      fontWeight: 700,
                      fontSize: "0.72rem"
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)", mt: 0.5, display: "block" }}>
                  {new Date(order.created_at).toLocaleDateString()} •{" "}
                  {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Typography>
              </Box>

              <Box className="order-header-right">
                <Box sx={{ textAlign: "right", mr: 1 }}>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)", display: "block" }}>
                    {t("dashboard.itemsCount", "{count} Items", { count: order.items?.length || 0 })}
                  </Typography>
                  <Typography variant="subtitle1" className="order-total-price">
                    {formatPrice(order.total_amount)}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  sx={{
                    color: "rgba(255, 255, 255, 0.6)",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.25s ease"
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Expandable Order Breakdown */}
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box className="order-details-body">
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "rgba(255, 255, 255, 0.9)" }}>
                  {t("cart.item", "Purchased Items")}
                </Typography>

                {/* Items List */}
                <Box className="order-items-grid">
                  {order.items?.map((item) => {
                    const isAudio = item.format_type === "AUDIO";
                    const isPhysical = item.format_type === "PHYSICAL";

                    return (
                      <Box key={item.id} className="order-item-row">
                        <img
                          src={item.cover_image_url || ppic14}
                          alt={item.book_title}
                          className="order-item-thumb"
                          onError={(e) => {
                            e.target.src = ppic14;
                          }}
                        />

                        <Box className="order-item-info">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#fff" }}>
                            {item.book_title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
                            {t("book.author", "Author")}: {item.author_name || "Author"}
                          </Typography>

                          <Box sx={{ mt: 0.8, display: "flex", alignItems: "center", gap: 1 }}>
                            <Chip
                              icon={
                                isAudio ? (
                                  <HeadphonesIcon sx={{ fontSize: "13px !important" }} />
                                ) : isPhysical ? (
                                  <Inventory2Icon sx={{ fontSize: "13px !important" }} />
                                ) : (
                                  <MenuBookIcon sx={{ fontSize: "13px !important" }} />
                                )
                              }
                              label={
                                isAudio
                                  ? t("common.format_audio", "Audiobook")
                                  : isPhysical
                                  ? t("common.format_physical", "Physical Book")
                                  : t("common.format_digital", "Digital (PDF)")
                              }
                              size="small"
                              sx={{
                                height: "20px",
                                fontSize: "0.68rem",
                                bgcolor: isAudio
                                  ? "rgba(171, 71, 188, 0.2)"
                                  : isPhysical
                                  ? "rgba(209, 120, 66, 0.2)"
                                  : "rgba(41, 182, 246, 0.2)",
                                color: isAudio ? "#ce93d8" : isPhysical ? "#ffab73" : "#81d4fa",
                                border: "1px solid rgba(255,255,255,0.1)"
                              }}
                            />
                            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
                              {t("cart.quantity", "Qty")}: {item.quantity}
                            </Typography>
                          </Box>
                        </Box>

                        <Box className="order-item-pricing">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#d17842" }}>
                            {formatPrice(item.snapshot_price)}
                          </Typography>
                          {item.quantity > 1 && (
                            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.4)", display: "block" }}>
                              {t("cart.lineTotal", "Total")}: {formatPrice(Number(item.snapshot_price) * item.quantity)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                {/* Delivery Snapshot (if physical shipping exists) */}
                {hasShipping && (
                  <Box className="order-shipping-card">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <LocalShippingIcon sx={{ fontSize: 18, color: "#d17842" }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", color: "#d17842" }}>
                        {t("cart.shippingAddress", "Delivery Destination")}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#eee" }}>
                      {order.shipping_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                      {order.shipping_city}, {order.shipping_country} • {order.shipping_address_line1}
                    </Typography>
                  </Box>
                )}

                {/* Price Breakdown Footer */}
                <Box className="order-breakdown-footer">
                  <Box className="breakdown-line">
                    <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
                      {t("dashboard.subtotal", "Subtotal")}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#eee" }}>
                      {formatPrice(order.subtotal || order.total_amount)}
                    </Typography>
                  </Box>

                  {Number(order.discount_amount) > 0 && (
                    <Box className="breakdown-line discount">
                      <Typography variant="caption" sx={{ color: "#81c784" }}>
                        {t("dashboard.discount", "Discount Applied")}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#81c784", fontWeight: 700 }}>
                        -{formatPrice(order.discount_amount)}
                      </Typography>
                    </Box>
                  )}

                  <Box className="breakdown-line grand-total">
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#fff" }}>
                      {t("dashboard.totalPaid", "Total Paid")}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#d17842" }}>
                      {formatPrice(order.total_amount)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
}