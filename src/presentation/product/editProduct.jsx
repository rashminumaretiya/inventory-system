import React from 'react'
import IMSForm from '../../shared/IMSForm'
import IMSFormFields from '../../shared/IMSFormFields'
import IMSStack from '../../shared/IMSStack'
import IMSButton from '../../shared/IMSButton'
import EditProductContainer from '../../container/editProduct.container'
import { productFields } from '../../description/productFields.description'

const EditProduct = ({editData}) => {
    const { handleChange, handleAddProduct, formData, error } =
    EditProductContainer({editData});
  return (
    <IMSForm onSubmit={handleAddProduct}>
      <IMSFormFields
        onChange={handleChange}
        error={error}
        helperText={error}
        fields={productFields}
        value={formData}
      />
      <IMSStack direction="row" justifyContent="flex-end" spacing={1}>
        <IMSButton variant="contained" type="submit">
          Update Product
        </IMSButton>
      </IMSStack>
    </IMSForm>
  )
}

export default EditProduct