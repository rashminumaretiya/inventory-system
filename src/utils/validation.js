const notEmpty = (label, value) => {
  if (value === "" || value === null || value === undefined) {
    return `Please Enter ${label}`;
  }
};
const phoneNumber = (label, value) => {
  const phoneRegex = /^[+]?(\d{1,2})?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/
  if (!value) {
    return `Please Enter ${label}`;
  } else if(!phoneRegex.test(value)) {
    return `Please Valid phone number`;
  }
};

const validation = (pattern, value, label) => {
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
