export const getCurrencySymbol = (currencyCode: string): string => {
  const currencySymbols: { [key: string]: string } = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', KRW: '₩',
    INR: '₹', CAD: 'C$', AUD: 'A$', CHF: 'Fr', SEK: 'kr', NOK: 'kr',
    DKK: 'kr', PLN: 'zł', CZK: 'Kč', HUF: 'Ft', RUB: '₽', BRL: 'R$',
    MXN: '$', ARS: '$', CLP: '$', COP: '$', PEN: 'S/', UYU: '$',
    ZAR: 'R', NGN: '₦', GHS: '₵', KES: 'KSh', UGX: 'USh', TZS: 'TSh',
    EGP: '£', MAD: 'DH', TND: 'د.ت', DZD: 'د.ج', LYD: 'ل.د',
    AED: 'د.إ', SAR: '﷼', QAR: '﷼', KWD: 'د.ك', BHD: '.د.ب',
    OMR: '﷼', JOD: 'د.ا', ILS: '₪', TRY: '₺', IRR: '﷼',
    PKR: '₨', BDT: '৳', LKR: '₨', NPR: '₨', BTN: 'Nu.',
    MVR: 'Rf', AFN: '؋', UZS: 'лв', KZT: '₸', KGS: 'лв',
    TJS: 'SM', TMT: 'T', MNT: '₮', MMK: 'K', THB: '฿',
    LAK: '₭', VND: '₫', KHR: '៛', IDR: 'Rp', MYR: 'RM',
    SGD: 'S$', PHP: '₱', TWD: 'NT$', HKD: 'HK$', MOP: 'MOP$',
    FJD: 'FJ$', TOP: 'T$', WST: 'WS$', SBD: 'SI$', VUV: 'VT',
    PGK: 'K', NZD: 'NZ$', XPF: '₣'
  };
  
  return currencySymbols[currencyCode] || currencyCode;
};