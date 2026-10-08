import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { IconButton, Tooltip } from "@mui/material";
import toast from "react-hot-toast";

import IMSButton from "../../shared/IMSButton";
import IMSStack from "../../shared/IMSStack";
import IMSTypography from "../../shared/IMSTypography";
import { getSettings } from "../../utils/settings";
import {
  WHATSAPP_GREEN,
  billMessage,
  openWhatsApp,
} from "../../utils/whatsapp";

/**
 * "Saved", with the two things people do next: send the bill on WhatsApp or
 * print it. The till has already cleared for the next customer, so this is
 * the moment to offer them.
 */
export const announceSaved = ({ order, t, onPrint }) =>
  toast.success(
    (shown) => (
      <IMSStack
        direction="row"
        alignItems="center"
        flexWrap="wrap"
        columnGap={1}
        rowGap={0.5}
      >
        <IMSTypography variant="body2">
          {t("toast.orderSaved", { invoice: order.invoiceNo })}
        </IMSTypography>
        <IMSButton
          size="small"
          variant="contained"
          startIcon={<WhatsAppIcon />}
          onClick={() => {
            openWhatsApp(
              order.customerInfo?.vendorPhone,
              billMessage(order, { t, settings: getSettings() }),
            );
            toast.dismiss(shown.id);
          }}
          sx={{ bgcolor: WHATSAPP_GREEN, "&:hover": { bgcolor: "#15803D" } }}
        >
          {t("whatsapp.send")}
        </IMSButton>
        <Tooltip title={t("buttonText.print")}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              onPrint(order);
              toast.dismiss(shown.id);
            }}
          >
            <PrintOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </IMSStack>
    ),
    { id: `saved-${order.id}`, duration: 8000 },
  );
