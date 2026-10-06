// --- 1. Define the type for your country object ---
interface Country {
  name: string;
  flag: string;
  currency: string; // This is the currency CODE (e.g., "CAD")
}


/**
 * Gets the currency SYMBOL for a given country name.
 * If the symbol isn't found, it returns the currency CODE as a fallback.
 *
 * @param countryName The full name of the country (e.g., "Canada").
 * @param countriesData The array of country objects.
 * @returns The currency symbol (e.g., "$", "€") or the code (e.g., "AFN")
 * if the symbol is not found or an error occurs.
 */
export function getCurrencySymbol(
  countryName: string,
  countriesData: Country[]
): string | undefined {
  
  // 1. Find the country
  const country = countriesData.find(
    (c) => c.name.toLowerCase() === countryName.toLowerCase()
  );

  if (!country) {
    console.warn(`Country not found: ${countryName}`);
    return undefined; // Country not in list, return undefined
  }

  // 2. Get the currency code
  const currencyCode = country.currency;

  try {
    // 3. Try to get the symbol
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'symbol',
    });

    const parts = formatter.formatToParts(0);
    const symbolPart = parts.find((part) => part.type === 'currency');

    // 4. ***MODIFIED***
    // If a symbol is found, return it. Otherwise, return the code.
    return symbolPart ? symbolPart.value : currencyCode;

  } catch (error) {
    // 5. ***MODIFIED***
    // If Intl.NumberFormat fails (e.g., "ZWL" is not recognized),
    // catch the error and return the currency code as a fallback.
    console.warn(
      `Could not find symbol for code "${currencyCode}". Returning code.`
    );
    return currencyCode;
  }
}