const validation = (pattern, value, label, t) => {
  const notEmpty = (label, value) => {
    if (value === "" || value === null || value === undefined) {
      return t("errorMsg.pleaseEnter", { field: t(label) });
    }
  };
  const phoneNumber = (label, value) => {
    console.log("t", t);
    const phoneRegex =
      /^[+]?(\d{1,2})?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
    if (!value) {
      return t("errorMsg.pleaseEnter", { field: t(label) });
    } else if (!phoneRegex.test(value)) {
      return t("errorMsg.validNumber");
    }
  };
  switch (pattern) {
    case "notEmpty":
      return notEmpty(label, value);
    case "phoneNumber":
      return phoneNumber(label, value);
    default:
      return "";
  }
};

export default validation;
