const n={_codes:new Map,async sendOTP(e){const o=Math.floor(1e5+Math.random()*9e5).toString();this._codes.set(e,o);try{const t=await fetch("/api/send-otp",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({email:e,code:o})});if(!t.ok)throw console.warn(`[OTP Backup] Backend email failed (${t.status}). Using local mock.`),new Error("Backend unavailable");return console.log(`[OTP SERVICE] Real email sent to ${e}`),alert(`[Dev Helper] Your OTP code is: ${o}`),!0}catch{return console.log(`%c[OTP SIMULATOR] Email to ${e} -> Code: ${o}`,"color: #10b981; font-weight: bold; font-size: 16px; padding: 4px; border: 1px solid #10b981; border-radius: 4px;"),setTimeout(()=>{alert(`[Development Mode]

Since "Resend" API is not configured locally, here is your simulated Verification Code:

${o}

(Enter this code to proceed)`)},500),!0}},async verifyOTP(e,o){await new Promise(r=>setTimeout(r,800));const t=this._codes.get(e);if(t&&t===o)return this._codes.delete(e),!0;throw new Error("Invalid verification code. Please try again.")}};export{n as o};
