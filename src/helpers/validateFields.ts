function validateFields(fields: any, requiredFields: any) {
  for (const field of requiredFields) {
    if (!fields[field]) {
      return `Field ${field} is required`;
    }
  }
  return null;
}

export default validateFields;
