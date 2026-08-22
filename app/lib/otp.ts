/** How many digits the emailed one-time code has.
 *
 *  Supabase decides this, not us: Authentication → Providers → Email → Email
 *  OTP Length, anywhere from 6 to 10. Change it there and change it here, or
 *  the form will reject codes that are perfectly valid.
 *
 *  The server side deliberately does *not* enforce this exact number — see
 *  `OTP_MIN`/`OTP_MAX`. A hardcoded length that drifts out of step with the
 *  project setting is how this broke the first time. */
export const OTP_LENGTH = 8;

/** The range Supabase permits. The action checks against this rather than
 *  `OTP_LENGTH` so that changing the dashboard setting degrades to "Supabase
 *  says the code is wrong" instead of "our form refuses to send it at all". */
export const OTP_MIN = 6;
export const OTP_MAX = 10;
