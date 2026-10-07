const IMSForm = ({ children, onSubmit }) => {
  return <form onSubmit={onSubmit}>{children}</form>;
};

export default IMSForm;
