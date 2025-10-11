import Swal, { type SweetAlertIcon } from "sweetalert2";

const PRIMARY_BUTTON_COLOR = "#2563eb";
const SECONDARY_BUTTON_COLOR = "#64748b";

type BasicOptions = {
  title: string;
  text?: string;
  timer?: number;
  confirmButtonText?: string;
};

const buildOptions = (icon: SweetAlertIcon, options: BasicOptions) => ({
  icon,
  title: options.title,
  text: options.text,
  timer: options.timer,
  showConfirmButton: true,
  confirmButtonText: options.confirmButtonText ?? "Entendido",
  confirmButtonColor: PRIMARY_BUTTON_COLOR,
  allowOutsideClick: false,
  allowEscapeKey: true,
});

export const showSuccess = (options: BasicOptions) => Swal.fire(buildOptions("success", options));

export const showError = (options: BasicOptions) => Swal.fire({
  ...buildOptions("error", options),
  confirmButtonColor: "#dc2626",
});

export const showWarning = (options: BasicOptions) => Swal.fire({
  ...buildOptions("warning", options),
  confirmButtonColor: "#f97316",
});

export const showInfo = (options: BasicOptions) => Swal.fire(buildOptions("info", options));

type ConfirmOptions = BasicOptions & {
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
};

const confirmDefaults = {
  cancelButtonText: "Cancelar",
  confirmButtonText: "Confirmar",
};

export const confirmAction = async (options: ConfirmOptions) => {
  const result = await Swal.fire({
    icon: "warning",
    title: options.title,
    text: options.text,
    showCancelButton: true,
    focusCancel: true,
    confirmButtonText: options.confirmButtonText ?? confirmDefaults.confirmButtonText,
    cancelButtonText: options.cancelButtonText ?? confirmDefaults.cancelButtonText,
    confirmButtonColor: options.confirmButtonColor ?? "#dc2626",
    cancelButtonColor: SECONDARY_BUTTON_COLOR,
    allowOutsideClick: false,
    allowEscapeKey: true,
  });
  return result.isConfirmed;
};
