import React from 'react'
import IMSForm from '../../shared/IMSForm'
import IMSFormFields from '../../shared/IMSFormFields'
import IMSStack from '../../shared/IMSStack'
import IMSButton from '../../shared/IMSButton'
import { customerFields } from '../../description/customerFields.description'
import EditCustomerContainer from '../../container/editCustomer.container'

const EditCustomer = ({editData}) => {
    const { handleChange, handleEditCustomer, formData, error } =
    EditCustomerContainer({editData});
  return (
    <IMSForm onSubmit={handleEditCustomer}>
      <IMSFormFields
        onChange={handleChange}
        error={error}
        helperText={error}
        fields={customerFields}
        value={formData}
      />
      <IMSStack direction="row" justifyContent="flex-end" spacing={1}>
        <IMSButton variant="contained" type="submit">
          Update Customer
        </IMSButton>
      </IMSStack>
    </IMSForm>
  )
}

export default EditCustomer