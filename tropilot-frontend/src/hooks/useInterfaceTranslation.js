import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EN_TO_VI_TRANSLATIONS, VI_TO_EN_TRANSLATIONS } from '../utils/interfaceTranslations.js';

const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'aria-label', 'title'];
const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA']);
const FIXED_DISPLAY_VALUES = {
  admin: 'Admin',
  'property administrator': 'Admin',
  'quản trị viên bất động sản': 'Admin',
  'quản trị viên bất đọng sản': 'Admin'
};

function getDictionary(language) {
  return language?.startsWith('en') ? VI_TO_EN_TRANSLATIONS : EN_TO_VI_TRANSLATIONS;
}

function createCaseInsensitiveDictionary(dictionary) {
  return Object.fromEntries(
    Object.entries(dictionary).map(([sourceText, translatedText]) => [sourceText.toLowerCase(), translatedText])
  );
}

function getTranslationContext(language) {
  const dictionary = getDictionary(language);

  return {
    dictionary,
    caseInsensitiveDictionary: createCaseInsensitiveDictionary(dictionary),
    isEnglish: language?.startsWith('en')
  };
}

function withOriginalSpacing(originalValue, translatedValue) {
  const leadingSpace = originalValue.match(/^\s*/)?.[0] || '';
  const trailingSpace = originalValue.match(/\s*$/)?.[0] || '';
  return `${leadingSpace}${translatedValue}${trailingSpace}`;
}

function shouldTranslateRange(rangeStart, rangeEnd, isEnglish) {
  const normalizedEnd = rangeEnd.trim().toLowerCase();
  const openLabel = isEnglish ? 'đang mở' : 'open';

  return /^\d/.test(rangeStart.trim()) && (/^\d/.test(rangeEnd.trim()) || normalizedEnd === openLabel);
}

function getVietnameseRoleName(roleCode) {
  const roleMap = {
    ADMIN: 'Quản trị viên',
    STAFF: 'Nhân viên',
    RESIDENT_HEAD: 'Chủ hộ'
  };

  return roleMap[roleCode] || roleCode;
}

function getEnglishRoleCode(roleName) {
  const roleMap = {
    'quản trị viên': 'ADMIN',
    'nhân viên': 'STAFF',
    'chủ hộ': 'RESIDENT_HEAD',
    'trưởng phòng': 'RESIDENT_HEAD'
  };

  return roleMap[roleName.trim().toLowerCase()] || roleName;
}

function translateDynamicValue(trimmedValue, isEnglish) {
  if (isEnglish) {
    const deleteBuildingMatch = trimmedValue.match(/^Xóa tòa nhà (.+)\?$/i);
    if (deleteBuildingMatch) {
      return `Delete building ${deleteBuildingMatch[1]}?`;
    }

    const deleteRoomMatch = trimmedValue.match(/^Xóa phòng (.+)\?$/i);
    if (deleteRoomMatch) {
      return `Delete room ${deleteRoomMatch[1]}?`;
    }

    const removeHeadResidentMatch = trimmedValue.match(/^Xóa chủ hộ khỏi phòng (.+)\?$/i);
    if (removeHeadResidentMatch) {
      return `Remove Head Resident from room ${removeHeadResidentMatch[1]}?`;
    }

    const regeneratePasswordMatch = trimmedValue.match(/^Bạn có chắc muốn tạo lại mật khẩu tạm thời cho (.+)\?$/i);
    if (regeneratePasswordMatch) {
      return `Are you sure you want to regenerate a temporary password for ${regeneratePasswordMatch[1]}?`;
    }

    const userActionMatch = trimmedValue.match(/^Bạn có chắc muốn (khóa|mở khóa) (.+)\?$/i);
    if (userActionMatch) {
      const action = userActionMatch[1].toLowerCase() === 'khóa' ? 'lock' : 'unlock';
      return `Are you sure you want to ${action} ${userActionMatch[2]}?`;
    }

    const userActionSuccessMatch = trimmedValue.match(/^(.+) đã được (xóa|khóa|mở khóa) thành công\.$/i);
    if (userActionSuccessMatch) {
      const actionMap = {
        'xóa': 'deleted',
        'khóa': 'locked',
        'mở khóa': 'unlocked'
      };
      return `${userActionSuccessMatch[1]} was ${actionMap[userActionSuccessMatch[2].toLowerCase()]} successfully.`;
    }

    const temporaryPasswordMatch = trimmedValue.match(/^Mật khẩu tạm thời của (.+): (.+)$/i);
    if (temporaryPasswordMatch) {
      return `Temporary password for ${temporaryPasswordMatch[1]}: ${temporaryPasswordMatch[2]}`;
    }

    const usageMatch = trimmedValue.match(/^Mức dùng:\s*(.+)$/i);
    if (usageMatch) {
      return `Usage: ${usageMatch[1]}`;
    }

    const occupantMatch = trimmedValue.match(/^(\d+)\s*\/\s*(\d+)\s+người đang ở$/i);
    if (occupantMatch) {
      return `${occupantMatch[1]} of ${occupantMatch[2]} active occupants`;
    }

    const confirmedContractMatch = trimmedValue.match(/^Đã xác nhận hợp đồng cho phòng (.+)$/i);
    if (confirmedContractMatch) {
      return `Confirmed contract for room ${confirmedContractMatch[1]}`;
    }

    const createdAccountMatch = trimmedValue.match(/^Đã tạo tài khoản (.+) cho (.+)$/i);
    if (createdAccountMatch) {
      return `Created ${getEnglishRoleCode(createdAccountMatch[1])} account for ${createdAccountMatch[2]}`;
    }

    const rangeMatch = trimmedValue.match(/^(.+)\s+đến\s+(.+)$/i);
    if (rangeMatch && shouldTranslateRange(rangeMatch[1], rangeMatch[2], true)) {
      const rangeEnd = rangeMatch[2].trim().toLowerCase() === 'đang mở' ? 'Open' : rangeMatch[2];
      return `${rangeMatch[1]} to ${rangeEnd}`;
    }

    return null;
  }

  const deleteBuildingMatch = trimmedValue.match(/^Delete building (.+)\?$/i);
  if (deleteBuildingMatch) {
    return `Xóa tòa nhà ${deleteBuildingMatch[1]}?`;
  }

  const deleteRoomMatch = trimmedValue.match(/^Delete room (.+)\?$/i);
  if (deleteRoomMatch) {
    return `Xóa phòng ${deleteRoomMatch[1]}?`;
  }

  const deleteServiceFeeMatch = trimmedValue.match(/^Delete service fee (.+)\?$/i);
  if (deleteServiceFeeMatch) {
    return `Xóa phí dịch vụ ${deleteServiceFeeMatch[1]}?`;
  }

  const removeHeadResidentMatch = trimmedValue.match(/^Remove Head Resident from room (.+)\?$/i);
  if (removeHeadResidentMatch) {
    return `Xóa chủ hộ khỏi phòng ${removeHeadResidentMatch[1]}?`;
  }

  const requestVehicleCancellationMatch = trimmedValue.match(/^Request cancellation for vehicle (.+)\?$/i);
  if (requestVehicleCancellationMatch) {
    return `Yêu cầu hủy xe ${requestVehicleCancellationMatch[1]}?`;
  }

  const markMemberLeftMatch = trimmedValue.match(/^Mark (.+) as left\?$/i);
  if (markMemberLeftMatch) {
    return `Đánh dấu ${markMemberLeftMatch[1]} đã rời đi?`;
  }

  const regeneratePasswordMatch = trimmedValue.match(/^Are you sure you want to regenerate a temporary password for (.+)\?$/i);
  if (regeneratePasswordMatch) {
    return `Bạn có chắc muốn tạo lại mật khẩu tạm thời cho ${regeneratePasswordMatch[1]}?`;
  }

  const userActionMatch = trimmedValue.match(/^Are you sure you want to (lock|unlock) (.+)\?$/i);
  if (userActionMatch) {
    const action = userActionMatch[1].toLowerCase() === 'lock' ? 'khóa' : 'mở khóa';
    return `Bạn có chắc muốn ${action} ${userActionMatch[2]}?`;
  }

  const userActionSuccessMatch = trimmedValue.match(/^(.+) was (deleted|locked|unlocked) successfully\.$/i);
  if (userActionSuccessMatch) {
    const actionMap = {
      deleted: 'xóa',
      locked: 'khóa',
      unlocked: 'mở khóa'
    };
    return `${userActionSuccessMatch[1]} đã được ${actionMap[userActionSuccessMatch[2].toLowerCase()]} thành công.`;
  }

  const temporaryPasswordMatch = trimmedValue.match(/^Temporary password for (.+): (.+)$/i);
  if (temporaryPasswordMatch) {
    return `Mật khẩu tạm thời của ${temporaryPasswordMatch[1]}: ${temporaryPasswordMatch[2]}`;
  }

  const maintenanceRequestTitleMatch = trimmedValue.match(/^Maintenance request #(.+): (.+)$/i);
  if (maintenanceRequestTitleMatch) {
    return `Yêu cầu bảo trì #${maintenanceRequestTitleMatch[1]}: ${maintenanceRequestTitleMatch[2]}`;
  }

  const plainOccupantMatch = trimmedValue.match(/^(\d+)\s+of\s+(\d+)$/i);
  if (plainOccupantMatch) {
    return `${plainOccupantMatch[1]} / ${plainOccupantMatch[2]}`;
  }

  const usageMatch = trimmedValue.match(/^Usage:\s*(.+)$/i);
  if (usageMatch) {
    return `Mức dùng: ${usageMatch[1]}`;
  }

  const occupantMatch = trimmedValue.match(/^(\d+)\s+of\s+(\d+)\s+active occupants$/i);
  if (occupantMatch) {
    return `${occupantMatch[1]} / ${occupantMatch[2]} người đang ở`;
  }

  const confirmedContractMatch = trimmedValue.match(/^Confirmed contract for room (.+)$/i);
  if (confirmedContractMatch) {
    return `Đã xác nhận hợp đồng cho phòng ${confirmedContractMatch[1]}`;
  }

  const createdAccountMatch = trimmedValue.match(/^Created (ADMIN|STAFF|RESIDENT_HEAD) account for (.+)$/i);
  if (createdAccountMatch) {
    return `Đã tạo tài khoản ${getVietnameseRoleName(createdAccountMatch[1].toUpperCase())} cho ${createdAccountMatch[2]}`;
  }

  const rangeMatch = trimmedValue.match(/^(.+)\s+to\s+(.+)$/i);
  if (rangeMatch && shouldTranslateRange(rangeMatch[1], rangeMatch[2], false)) {
    const rangeEnd = rangeMatch[2].trim().toLowerCase() === 'open' ? 'Đang mở' : rangeMatch[2];
    return `${rangeMatch[1]} đến ${rangeEnd}`;
  }

  return null;
}

function translateValue(value, translationContext) {
  if (!value || !value.trim()) {
    return value;
  }

  const trimmedValue = value.trim();
  const fixedDisplayValue = FIXED_DISPLAY_VALUES[trimmedValue.toLowerCase()];
  if (fixedDisplayValue) {
    return withOriginalSpacing(value, fixedDisplayValue);
  }

  const translatedValue =
    translationContext.dictionary[trimmedValue] ||
    translationContext.caseInsensitiveDictionary[trimmedValue.toLowerCase()] ||
    translateDynamicValue(trimmedValue, translationContext.isEnglish);

  return translatedValue ? withOriginalSpacing(value, translatedValue) : value;
}

function translateTextNode(textNode, translationContext) {
  const translatedValue = translateValue(textNode.nodeValue, translationContext);

  if (translatedValue !== textNode.nodeValue) {
    textNode.nodeValue = translatedValue;
  }
}

function translateElementAttributes(element, translationContext) {
  TRANSLATABLE_ATTRIBUTES.forEach((attributeName) => {
    if (!element.hasAttribute(attributeName)) {
      return;
    }

    const currentValue = element.getAttribute(attributeName);
    const translatedValue = translateValue(currentValue, translationContext);

    if (translatedValue !== currentValue) {
      element.setAttribute(attributeName, translatedValue);
    }
  });
}

function translateNode(node, translationContext) {
  if (node.nodeType === Node.TEXT_NODE) {
    translateTextNode(node, translationContext);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  translateElementAttributes(node, translationContext);

  if (IGNORED_TAGS.has(node.tagName)) {
    return;
  }

  node.childNodes.forEach((childNode) => {
    translateNode(childNode, translationContext);
  });
}

export function useInterfaceTranslation() {
  const { i18n } = useTranslation();

  useEffect(() => {
    let frameId;
    const translationContext = getTranslationContext(i18n.language);

    const translateDocument = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        translateNode(document.body, translationContext);
      });
    };

    translateDocument();

    const observer = new MutationObserver(translateDocument);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES
    });

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [i18n.language]);
}
