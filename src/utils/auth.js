export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePassword(password) {
  if (password.length < 6) {
    return 'يجب أن تكون كلمة المرور 6 أحرف على الأقل'
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'يجب أن تحتوي كلمة المرور على حرف كبير (A-Z)، وحرف صغير (a-z)، ورقم (0-9)، ورمز خاص (مثل: P@ssw0rd)'
  }
  return null
}

export function validateName(name) {
  const nameRegex = /^[\u0600-\u06FFa-zA-Z]{2,}\s+[\u0600-\u06FFa-zA-Z]{2,}(?:\s+[\u0600-\u06FFa-zA-Z]{2,})*$/;
  if (!name || !name.trim()) {
    return 'الاسم مطلوب'
  }
  if (!nameRegex.test(name.trim())) {
    return 'يجب إدخال الاسم ثنائياً على الأقل ويحتوي على أحرف فقط'
  }
  return null
}

export function translateAuthError(errorMsg) {
  if (!errorMsg) return 'حدث خطأ غير متوقع'
  
  const lower = errorMsg.toLowerCase()
  
  if (
    lower.includes('already taken') || 
    lower.includes('already exists') || 
    lower.includes('duplicateemail') || 
    lower.includes('duplicateusername') ||
    lower.includes('is already registered') ||
    lower.includes('email is already in use')
  ) {
    return 'البريد الإلكتروني مسجل بالفعل'
  }
  
  if (
    lower.includes('invalid username or password') || 
    lower.includes('invalid login attempt') || 
    lower.includes('incorrect password') ||
    lower.includes('wrong password')
  ) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
  }
  
  if (
    lower.includes('password must have at least one non alphanumeric') ||
    lower.includes('passwords must have at least one non alphanumeric')
  ) {
    return 'يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل (مثل @)'
  }
  
  if (
    lower.includes('password must have at least one digit') ||
    lower.includes('passwords must have at least one digit')
  ) {
    return 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل (0-9)'
  }
  
  if (
    lower.includes('password must have at least one uppercase') ||
    lower.includes('passwords must have at least one uppercase')
  ) {
    return 'يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل (A-Z)'
  }
  
  if (
    lower.includes('password must have at least one lowercase') ||
    lower.includes('passwords must have at least one lowercase')
  ) {
    return 'يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل (a-z)'
  }

  if (lower.includes('user not found') || lower.includes('no user found')) {
    return 'المستخدم غير موجود'
  }
  
  return errorMsg
}
