export interface BdDistrict {
  code: string;
  name: string;
}

export const BD_DISTRICTS: BdDistrict[] = [
  { code: "BD-13", name: "Dhaka" },
  { code: "BD-10", name: "Chattogram" },
  { code: "BD-18", name: "Gazipur" },
  { code: "BD-40", name: "Narayanganj" },
  { code: "BD-60", name: "Sylhet" },
  { code: "BD-54", name: "Rajshahi" },
  { code: "BD-27", name: "Khulna" },
  { code: "BD-06", name: "Barishal" },
  { code: "BD-55", name: "Rangpur" },
  { code: "BD-34", name: "Mymensingh" },
  { code: "BD-08", name: "Cumilla" },
  { code: "BD-11", name: "Cox's Bazar" },
  { code: "BD-03", name: "Bogura" },
  { code: "BD-05", name: "Bagerhat" },
  { code: "BD-01", name: "Bandarban" },
  { code: "BD-02", name: "Barguna" },
  { code: "BD-07", name: "Bhola" },
  { code: "BD-04", name: "Brahmanbaria" },
  { code: "BD-09", name: "Chandpur" },
  { code: "BD-12", name: "Chuadanga" },
  { code: "BD-14", name: "Dinajpur" },
  { code: "BD-15", name: "Faridpur" },
  { code: "BD-16", name: "Feni" },
  { code: "BD-19", name: "Gaibandha" },
  { code: "BD-17", name: "Gopalganj" },
  { code: "BD-20", name: "Habiganj" },
  { code: "BD-21", name: "Jamalpur" },
  { code: "BD-22", name: "Jashore" },
  { code: "BD-25", name: "Jhalokati" },
  { code: "BD-23", name: "Jhenaidah" },
  { code: "BD-24", name: "Joypurhat" },
  { code: "BD-29", name: "Khagrachhari" },
  { code: "BD-26", name: "Kishoreganj" },
  { code: "BD-28", name: "Kurigram" },
  { code: "BD-30", name: "Kushtia" },
  { code: "BD-31", name: "Lakshmipur" },
  { code: "BD-32", name: "Lalmonirhat" },
  { code: "BD-36", name: "Madaripur" },
  { code: "BD-37", name: "Magura" },
  { code: "BD-33", name: "Manikganj" },
  { code: "BD-39", name: "Meherpur" },
  { code: "BD-38", name: "Moulvibazar" },
  { code: "BD-35", name: "Munshiganj" },
  { code: "BD-48", name: "Naogaon" },
  { code: "BD-43", name: "Narail" },
  { code: "BD-42", name: "Narsingdi" },
  { code: "BD-44", name: "Natore" },
  { code: "BD-45", name: "Nawabganj (Chapai)" },
  { code: "BD-41", name: "Netrokona" },
  { code: "BD-46", name: "Nilphamari" },
  { code: "BD-47", name: "Noakhali" },
  { code: "BD-49", name: "Pabna" },
  { code: "BD-52", name: "Panchagarh" },
  { code: "BD-51", name: "Patuakhali" },
  { code: "BD-50", name: "Pirojpur" },
  { code: "BD-53", name: "Rajbari" },
  { code: "BD-56", name: "Rangamati" },
  { code: "BD-58", name: "Satkhira" },
  { code: "BD-62", name: "Shariatpur" },
  { code: "BD-57", name: "Sherpur" },
  { code: "BD-59", name: "Sirajganj" },
  { code: "BD-61", name: "Sunamganj" },
  { code: "BD-63", name: "Tangail" },
  { code: "BD-64", name: "Thakurgaon" },
];

export const DISTRICT_POSTCODES: Record<string, string> = {
  "BD-13": "1200", // Dhaka
  "BD-10": "4000", // Chattogram
  "BD-18": "1700", // Gazipur
  "BD-40": "1400", // Narayanganj
  "BD-60": "3100", // Sylhet
  "BD-54": "6000", // Rajshahi
  "BD-27": "9000", // Khulna
  "BD-06": "8200", // Barishal
  "BD-55": "5400", // Rangpur
  "BD-34": "2200", // Mymensingh
  "BD-08": "3500", // Cumilla
  "BD-11": "4700", // Cox's Bazar
  "BD-03": "5800", // Bogura
  "BD-05": "9300", // Bagerhat
  "BD-01": "4600", // Bandarban
  "BD-02": "8700", // Barguna
  "BD-07": "8300", // Bhola
  "BD-04": "3400", // Brahmanbaria
  "BD-09": "3600", // Chandpur
  "BD-12": "7200", // Chuadanga
  "BD-14": "5200", // Dinajpur
  "BD-15": "7800", // Faridpur
  "BD-16": "3900", // Feni
  "BD-19": "5700", // Gaibandha
  "BD-17": "8100", // Gopalganj
  "BD-20": "3300", // Habiganj
  "BD-21": "2000", // Jamalpur
  "BD-22": "7400", // Jashore
  "BD-25": "8400", // Jhalokati
  "BD-23": "7300", // Jhenaidah
  "BD-24": "5900", // Joypurhat
  "BD-29": "4400", // Khagrachhari
  "BD-26": "2300", // Kishoreganj
  "BD-28": "5600", // Kurigram
  "BD-30": "3800", // Kushtia
  "BD-31": "3700", // Lakshmipur
  "BD-32": "5500", // Lalmonirhat
  "BD-33": "1200", // Madaripur
  "BD-35": "7600", // Magura
  "BD-36": "1800", // Manikganj
  "BD-37": "7100", // Meherpur
  "BD-38": "3900", // Moulvibazar
  "BD-39": "1500", // Munshiganj
  "BD-41": "2400", // Netrokona
  "BD-46": "5300", // Nilphamari
  "BD-47": "3800", // Noakhali
  "BD-49": "6600", // Pabna
  "BD-52": "5000", // Panchagarh
  "BD-51": "8600", // Patuakhali
  "BD-50": "8500", // Pirojpur
  "BD-53": "7700", // Rajbari
  "BD-56": "4500", // Rangamati
  "BD-58": "9400", // Satkhira
  "BD-62": "8000", // Shariatpur
  "BD-57": "2100", // Sherpur
  "BD-59": "6700", // Sirajganj
  "BD-61": "3000", // Sunamganj
  "BD-63": "1900", // Tangail
  "BD-64": "5100", // Thakurgaon
};

export function getDistrictPostcode(code: string): string {
  return DISTRICT_POSTCODES[code] || "1200";
}
