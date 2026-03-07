import{a as c,c as v,j as t,b,d as f,A as k}from"./index-CM2xLAYV.js";import{N as x,F as P}from"./Footer-BC5a3-kB.js";import{a as w}from"./seo-dU0W_BoR.js";const u={title:"Privacy Policy | All Previous Paper Hub",description:"Privacy Policy for All Previous Paper Hub: data collection, usage, cookies, and contact information.",keywords:"privacy policy, all previous paper hub, data policy, cookies policy"},A=`
  <h2>Privacy Policy</h2>
  <p>
    All Previous Paper Hub par aapki privacy important hai. Hum basic usage data sirf service improve karne ke liye use karte hain.
  </p>
  <h3>1. Information We Collect</h3>
  <ul>
    <li>Basic browser/device details for analytics and security.</li>
    <li>Search/query usage patterns for improving navigation and results.</li>
    <li>Feedback forms me diya gaya data (agar aap submit karein).</li>
  </ul>
  <h3>2. How We Use Information</h3>
  <ul>
    <li>Website performance aur user experience improve karne ke liye.</li>
    <li>Security monitoring aur misuse detection ke liye.</li>
    <li>Content quality aur relevant updates ke liye.</li>
  </ul>
  <h3>3. Cookies</h3>
  <p>
    Website cookies use kar sakti hai for session handling, analytics, and preferences. Aap browser settings me cookies manage kar sakte hain.
  </p>
  <h3>4. Third-Party Services</h3>
  <p>
    Analytics, ads, ya embedded services third-party policies ke under ho sakte hain. Un services ki privacy policy alag hogi.
  </p>
  <h3>5. Contact</h3>
  <p>
    Agar privacy related concern ho, to website footer me available contact details par reach karein.
  </p>
`,o=(e,a,n="name")=>{let i=document.querySelector(`meta[${n}='${e}']`);i||(i=document.createElement("meta"),i.setAttribute(n,e),document.head.appendChild(i)),i.setAttribute("content",a||"")},j=e=>{let a=document.querySelector("link[rel='canonical']");a||(a=document.createElement("link"),a.setAttribute("rel","canonical"),document.head.appendChild(a)),a.setAttribute("href",e)};function E(){const[e,a]=c.useState(null),[n,i]=c.useState(null),[p,m]=c.useState(!0);return c.useEffect(()=>{let s=!0;return(async()=>{try{const[r,l]=await Promise.all([b({ttlMs:45e3}),f.get(`${k}/api/pages/slug/privacy-policy`).catch(()=>({data:null}))]);if(!s)return;i(r||{}),a(l.data||null)}catch{if(!s)return;i({}),a(null)}finally{s&&m(!1)}})(),()=>{s=!1}},[]),c.useEffect(()=>{if(p)return;const s=n||{};if(w({settings:s,context:{page:"privacy-policy"},pathname:window.location.pathname}))return;const r=(e?.seoTitle||e?.title||u.title).trim(),l=(e?.seoDescription||u.description).trim(),g=(e?.seoKeywords||u.keywords).trim(),h=(e?.canonicalUrl||`${window.location.origin}/privacy-policy`).trim();if(document.title=r,o("description",l),o("keywords",g),o("og:title",r,"property"),o("og:description",l,"property"),o("twitter:title",r),o("twitter:description",l),e?.seoImage||s?.ogImage){const d=v(e?.seoImage||s?.ogImage);o("og:image",d,"property"),o("twitter:image",d)}j(h)},[p,n,e]),t.jsxs("div",{className:"page-shell",children:[t.jsx(x,{}),t.jsx("div",{className:"page-content",children:t.jsx("section",{className:"about-page py-5",children:t.jsx("div",{className:"container",children:p?t.jsxs("div",{className:"about-hero mb-4",children:[t.jsx("p",{className:"about-eyebrow",children:"Loading"}),t.jsx("h1",{className:"about-title",children:"Please wait..."})]}):t.jsxs(t.Fragment,{children:[t.jsxs("div",{className:"about-hero mb-4",children:[t.jsx("p",{className:"about-eyebrow",children:e?.extra?.heroEyebrow||"Legal"}),t.jsx("h1",{className:"about-title",children:e?.title||"Privacy Policy"})]}),t.jsx("div",{className:"about-block about-managed-content",dangerouslySetInnerHTML:{__html:e?.contentHtml||A}})]})})})}),t.jsx("div",{className:"footer-top-gap"}),t.jsx(P,{})]})}export{E as default};
