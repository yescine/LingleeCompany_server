export const draftMail = (data) =>(
   `<div>
      <h1>Verification</h1>
      <p>password ${data.password}</p>
      <p>click on the link to verify <span><a href="http://${data.link}/">verify password</a></span> </p>
  </div>`
);