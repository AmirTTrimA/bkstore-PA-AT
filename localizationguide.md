That is the single most important instruction for handing off the backend work. If your friend doesn't implement the localization handshake correctly, they will only ever see English.

Here is a concise guide you can share with your friend, detailing exactly what they need to do on the React side to handle bilingual content.

---

## React Localization Guide (EN/FA)

The core principle is simple: The React frontend handles **all UI text**, but it must tell the Django backend which language is active so the backend can respond with the correct **error messages and data formats**.

### 1\. The Language Handshake (Crucial Step)

For every API request that your frontend makes to the Django backend (especially for authenticated endpoints or forms), your friend must include the **`Accept-Language` HTTP header**.

| Language Selected | Header Value to Send  | Purpose                              |
| :---------------- | :-------------------- | :----------------------------------- |
| **English (EN)**  | `Accept-Language: en` | Django sends English error messages. |
| **Farsi (FA)**    | `Accept-Language: fa` | Django sends Farsi error messages.   |

**Example using JavaScript `fetch`:**

```javascript
// This is the common pattern your friend should use for API calls
const lang = getCurrentLanguage(); // 'en' or 'fa'

const response = await fetch("/api/v1/auth/register/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // 🔑 THIS IS THE KEY LOCALIZATION HEADER:
    "Accept-Language": lang,
    // Authorization header would also go here if authenticated
  },
  body: JSON.stringify(data),
});
```

### 2\. Frontend Implementation (`react-i18next`)

Since React handles the user interface text, your friend should use a dedicated, standard library like **`react-i18next`**.

- **Setup:** They will set up translation files (usually `.json` files) within the React app: one for English (`en.json`) and one for Farsi (`fa.json`).
- **UI Text:** All text displayed to the user in React components will be managed and swapped out by this library.

| File          | Content Example                             |
| :------------ | :------------------------------------------ |
| **`en.json`** | `"welcome_msg": "Welcome to the Bookstore"` |
| **`fa.json`** | `"welcome_msg": "به کتابفروشی خوش آمدید"`   |

### 3\. Handling Error Messages

This is where the two stacks connect seamlessly:

1.  **Backend Response:** When the user tries to register with mismatched passwords, the Django backend sees the `Accept-Language: fa` header and sends the Farsi error message:
    ```json
    { "password": "رمزهای عبور مطابقت ندارند." }
    ```
2.  **Frontend Display:** The React app receives this Farsi error message and displays it directly to the user, ensuring system-generated text is in the user's chosen language.

### 4\. Summary of Instructions for Your Friend

Tell your friend that their key responsibilities for bilingual support are:

1.  **Install/Use `react-i18next`** for all UI display strings.
2.  **Maintain a global state** for the currently active language (`'en'` or `'fa'`).
3.  **Ensure every API request includes the `Accept-Language` header** based on that global language state.
