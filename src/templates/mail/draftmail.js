export const draftMail = (data)=>{
   switch (data.template) {
      case 'signup-verify':
         return(
            `<div>
               <h1>Verification</h1>
               <p>password: ${data.password}</p>
               <p>click on the link to restore your password: <span><a href="http://${data.link}/">restore password</a></span> </p>
            </div>`
        )  
         
      case 'restore-password':
         return(`<div>
               <h1>Link to restore password </h1>
               <p>Your new password: ${data.password}</p>
               <p>click on the link to confirm the ownership of your password restoration: <span><a href="http://${data.link}/">yes restore my password</a> or ignore this email</span> </p>
            </div>`
         ) 
      case 'confirm-restore-password':
         return(`<div>
               <h1>password restored successfully </h1>
               <p>you can sign in to your account</p>
            </div>`
         )      
   
      default:
         break;
   }
}
