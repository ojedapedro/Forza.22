const API_URL = 'https://script.google.com/macros/s/AKfycbyxVkNV8XIqvDgTOY5kj5FQsHCR6BWkHHnxaQ78rMW5kPm_EWoOc3iusVxiG3Dyfp9e/exec';
fetch(`${API_URL}?action=getEmployees`)
  .then(res => {
    console.log('Status:', res.status);
    return res.text();
  })
  .then(text => console.log('Body:', text))
  .catch(err => console.error(err));
