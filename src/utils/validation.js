const notEmpty = (label, value) => {
  if (value === "" || value === null || value === undefined) {
    return `Please Enter ${label}`;
  }
};

const validation = (pattern, value, label) => {
  switch (pattern) {
    case "notEmpty":
      return notEmpty(label, value);
    default:
      return "";
  }
};

export default validation;
