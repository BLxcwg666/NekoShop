export function normalizeContactInfo(contact: string): string {
  if (!contact || contact.trim().length === 0) {
    return contact;
  }
  
  const trimmed = contact.trim();
  
  if (/^\d{5,20}$/.test(trimmed)) {
    return trimmed + "@qq.com";
  }
  
  return trimmed;
}

export function validateContact(contact: string): boolean {
  if (!contact || contact.trim().length === 0) {
    return false;
  }

  const normalizedContact = normalizeContactInfo(contact);

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  const qqPattern = /^\d{6,20}$/;

  if (emailPattern.test(normalizedContact)) {
    return true;
  }

  if (qqPattern.test(normalizedContact.replace('@qq.com', ''))) {
    return true;
  }

  return false;
}

export function getContactValidationError(contact: string): string | null {
  if (!contact || contact.trim().length === 0) {
    return "联系方式不能为空";
  }

  if (!validateContact(contact)) {
    return "联系方式必须是有效的QQ号（6-20位数字）或邮箱地址";
  }

  return null;
}