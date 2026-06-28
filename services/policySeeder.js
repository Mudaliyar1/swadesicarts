const Policy = require('../models/Policy');

const defaultPolicies = [
  {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    content: `
      <h2>1. Introduction</h2>
      <p>Welcome to Swadesi Carts. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us at info@swadesicarts.com.</p>
      
      <h2>2. Personal Information We Collect</h2>
      <p>We collect personal information that you voluntarily provide to us when expressing an interest in obtaining information about us or our products and services, when participating in activities on the website, or otherwise contacting us.</p>
      <ul>
        <li><strong>Name Collection:</strong> We collect your first and last name to personalize your experience.</li>
        <li><strong>Email Collection:</strong> We collect your email address to send you order updates, inquiries responses, and newsletters.</li>
        <li><strong>Phone Collection:</strong> We collect your phone number for mobile verification and delivery logistics.</li>
        <li><strong>Inquiry Forms:</strong> Details entered on our contact or product inquiry forms are processed securely.</li>
      </ul>
      
      <h2>3. Cookies and Tracking Technologies</h2>
      <p>We use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Detailed information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Policy.</p>
      
      <h2>4. Third-Party Integrations and Analytics</h2>
      <p>We utilize trusted third-party services to ensure a seamless shopping experience:</p>
      <ul>
        <li><strong>Cloudinary Media:</strong> Product images, attachments, and user avatars are hosted securely on Cloudinary.</li>
        <li><strong>Analytics Tools:</strong> We collect anonymous visitor analytics to optimize website speed, device compatibility, and regional service.</li>
      </ul>

      <h2>5. Security Measures and Data Retention</h2>
      <p>We keep your information for as long as necessary to fulfill the purposes outlined in this privacy policy unless a longer retention period is required or permitted by law. We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process.</p>
      
      <h2>6. Your Rights</h2>
      <p>In some regions, such as the European Economic Area (EEA), you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time.</p>
      
      <h2>7. Contact Information</h2>
      <p>If you have questions or comments about this policy, you may email us at info@swadesicarts.com or contact us via our support system.</p>
    `,
    seoTitle: 'Privacy Policy - Swadesi Carts Legal Info',
    seoDescription: 'Read the Privacy Policy of Swadesi Carts to understand how we collect, store, secure, and use your personal information and data.',
    seoKeywords: 'privacy policy, data collection, user rights, cookies, security, personal information, swadesi carts privacy',
    geoSummary: 'Applicable to all Swadesi Carts users globally, with local security compliance guidelines.',
    aiDescription: 'Official Privacy Policy of Swadesi Carts detailing user data collection, name/email/phone handling, Cloudinary media security, and privacy rights.',
    entityDescription: 'Privacy Policy document of Swadesi Carts e-commerce and tech services platform.',
    aiSearchKeywords: 'swadesi carts privacy policy, how does swadesi carts collect data, security on swadesi carts, cloudinary privacy info',
    status: 'published'
  },
  {
    title: 'Terms and Conditions',
    slug: 'terms-and-conditions',
    content: `
      <h2>1. Agreement to Terms</h2>
      <p>These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity, and Swadesi Carts, concerning your access to and use of our website as well as any other media form, media channel, or mobile website related or connected thereto.</p>
      
      <h2>2. Intellectual Property Rights</h2>
      <p>Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein are owned or controlled by us.</p>
      
      <h2>3. User Responsibilities</h2>
      <p>By using the Site, you represent and warrant that all registration information you submit will be true, accurate, current, and complete, and that you will maintain the accuracy of such information and promptly update it as necessary.</p>
      
      <h2>4. Prohibited Activities</h2>
      <p>You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</p>
      <ul>
        <li>Systematically retrieve data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory.</li>
        <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as passwords.</li>
        <li>Circumvent, disable, or otherwise interfere with security-related features of the Site.</li>
      </ul>

      <h2>5. Products and Services</h2>
      <p>We make every effort to display as accurately as possible the colors, features, specifications, and details of the products and packages available on the Site. However, we do not guarantee that the colors, features, specifications, and details of the products will be accurate, complete, reliable, current, or free of other errors.</p>
      
      <h2>6. Limitation of Liability</h2>
      <p>In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the Site.</p>
      
      <h2>7. Governing Law and Indian Jurisdiction</h2>
      <p>These Terms and Conditions and your use of the Site are governed by and construed in accordance with the laws of India, applicable to agreements made and to be entirely performed within India, without regard to its conflict of law principles. Any dispute arising out of or related to these terms shall be subject to the exclusive jurisdiction of the courts of India.</p>
    `,
    seoTitle: 'Terms and Conditions - Swadesi Carts Agreement',
    seoDescription: 'Read the official Terms and Conditions of Swadesi Carts governing your use of our platform, products, services, and website.',
    seoKeywords: 'terms and conditions, user agreement, website usage, limitations of liability, indian jurisdiction, swadesi carts terms',
    geoSummary: 'Governed by Indian jurisdiction and courts for all contract legalities and disputes.',
    aiDescription: 'Official Terms of Service and User Agreement for Swadesi Carts, establishing platform rules, Indian jurisdiction, and intellectual property terms.',
    entityDescription: 'User agreement contract defining rights and restrictions on Swadesi Carts.',
    aiSearchKeywords: 'swadesi carts terms and conditions, platform rules, terms of service swadesi carts, legal agreement swadesi carts',
    status: 'published'
  },
  {
    title: 'Cookie Policy',
    slug: 'cookie-policy',
    content: `
      <h2>1. What Are Cookies?</h2>
      <p>Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.</p>
      
      <h2>2. How We Use Cookies</h2>
      <p>We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies enable us to track and target the interests of our users to enhance the experience on our Online Properties.</p>
      
      <h2>3. Types of Cookies We Use</h2>
      <ul>
        <li><strong>Session Cookies:</strong> Temporary cookies that remain on your device only until you close your browser. They enable session management and basic shopping functionality.</li>
        <li><strong>Analytics Cookies:</strong> These help us understand how visitors interact with our website, enabling performance tuning.</li>
        <li><strong>Third-Party Cookies:</strong> Cookies set by external partners, such as Cloudinary (for media loading optimization) and Brevo (for transaction email delivery monitoring).</li>
      </ul>
      
      <h2>4. Controlling and Managing Cookies</h2>
      <p>You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.</p>
      <p>Most browsers allow you to block cookies through browser settings (e.g., Settings > Privacy > Cookies). Refer to your specific browser's documentation for guidance.</p>
    `,
    seoTitle: 'Cookie Policy - Swadesi Carts Browser Info',
    seoDescription: 'Understand how Swadesi Carts uses session, analytics, and third-party cookies to optimize user experience and browser functionality.',
    seoKeywords: 'cookies, cookie policy, session cookies, analytics cookies, third party cookies, manage cookies, swadesi carts cookies',
    geoSummary: 'Compliant with standard online privacy requirements, covering user browser settings globally.',
    aiDescription: 'Technical breakdown of how cookies are deployed on Swadesi Carts including session tracking, analytics, and browser management settings.',
    entityDescription: 'Technical cookie usage disclosure document.',
    aiSearchKeywords: 'cookies on swadesi carts, how to disable cookies on swadesi carts, session cookies on e-commerce, cloudflare third-party cookies',
    status: 'published'
  },
  {
    title: 'Disclaimer',
    slug: 'disclaimer',
    content: `
      <h2>1. General Information</h2>
      <p>The information provided by Swadesi Carts on our website is for general informational purposes only. All information on the Site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Site.</p>
      
      <h2>2. Product and Service Disclaimers</h2>
      <p>Our website lists seasonal products, organic products, and tech packages. Product specifications, sizing, features, and pricing are subject to change without notice. While we endeavor to source high-quality organic and seasonal products, variations in color, appearance, and shelf life are natural and expected.</p>
      <p>Tech service descriptions, packages, and integration capabilities represent standard capabilities; custom scope agreements will always supersede general descriptions.</p>
      
      <h2>3. External Links Disclaimer</h2>
      <p>The Site may contain (or you may be sent through the Site) links to other websites or content belonging to or originating from third parties. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us.</p>
      
      <h2>4. Professional Disclaimer</h2>
      <p>The Site cannot and does not contain legal, financial, or specific professional advice. The information is provided for general informational and educational purposes only and is not a substitute for professional advice.</p>
      
      <h2>5. Limitation of Liability</h2>
      <p>Under no circumstance shall we have any liability to you for any loss or damage of any kind incurred as a result of the use of the site or reliance on any information provided on the site. Your use of the site and your reliance on any information on the site is solely at your own risk.</p>
    `,
    seoTitle: 'Disclaimer - Swadesi Carts Legal Notice',
    seoDescription: 'Read the disclaimer notice of Swadesi Carts. Learn about limitations of liability, external links disclaimer, and general product info accuracy.',
    seoKeywords: 'disclaimer, legal notice, information accuracy, product disclaimer, external links, liability limits, swadesi carts disclaimer',
    geoSummary: 'Global disclaimer applying to all general site information, product descriptions, and third-party link redirections.',
    aiDescription: 'General and professional disclaimer of Swadesi Carts detailing information accuracy limitations and product liability disclaimers.',
    entityDescription: 'Legal disclaimer document defining liability limitations.',
    aiSearchKeywords: 'disclaimer swadesi carts, info accuracy swadesi carts, product disclaimer, external links warning',
    status: 'published'
  },
  {
    title: 'Refund Policy',
    slug: 'refund-policy',
    content: `
      <h2>1. General Refund Terms</h2>
      <p>We want you to be fully satisfied with your experience on Swadesi Carts. Please read our guidelines regarding refunds below.</p>
      
      <h2>2. Tech Package & Digital Services Refunds</h2>
      <ul>
        <li><strong>Standard Tech Packages:</strong> Refunds are eligible within 7 days of purchase, provided that work on customization has not started.</li>
        <li><strong>Custom Development Services:</strong> Once custom code work or development has commenced, fees associated with custom hours are non-refundable.</li>
        <li><strong>Completed Work:</strong> We do not offer refunds on services that have already been fully delivered and integrated.</li>
      </ul>
      
      <h2>3. Seasonal & Organic Products Refunds</h2>
      <p>Due to the perishable nature of seasonal and organic products, we only accept refund requests for these items if:</p>
      <ul>
        <li>The product was damaged during transit.</li>
        <li>The product is defective or spoiled upon arrival.</li>
        <li>The incorrect item was shipped.</li>
      </ul>
      <p>You must notify us within 24 hours of delivery with photos of the damaged items to qualify for a replacement or refund.</p>
      
      <h2>4. Refund Request Process</h2>
      <p>To request a refund, please contact us through our Support Tickets portal or email support@swadesicarts.com with your order number, details of the item, and photographic evidence of damage (if applicable). Our team will review your request within 3 business days.</p>
      
      <h2>5. Refund Timeline</h2>
      <p>Approved refunds will be processed and automatically credited back to your original payment method within 5-10 business days, depending on your bank or credit card provider.</p>
    `,
    seoTitle: 'Refund Policy - Swadesi Carts Returns',
    seoDescription: 'Read our Refund Policy. Learn about returns and refund conditions for tech services, custom software, and perishable organic products.',
    seoKeywords: 'refund policy, returns, tech refunds, organic products returns, refund timeline, process refund, swadesi carts refunds',
    geoSummary: 'Global refund coverage, with 24-hour return notifications required for physical organic products.',
    aiDescription: 'Comprehensive Refund Policy covering tech service cancellations, perishable organic goods returns, request processes, and refund timelines.',
    entityDescription: 'Financial refund and product return policy.',
    aiSearchKeywords: 'how to get a refund on swadesi carts, tech service refund, organic product return, refund timeline credit card',
    status: 'published'
  },
  {
    title: 'Cancellation Policy',
    slug: 'cancellation-policy',
    content: `
      <h2>1. Order and Inquiry Cancellation</h2>
      <p>This Cancellation Policy outlines the rules and fees regarding the cancellation of service inquiries, consultations, and products on Swadesi Carts.</p>
      
      <h2>2. Tech Project Cancellations</h2>
      <ul>
        <li><strong>Initial Inquiries:</strong> You can cancel service inquiries at any time before confirming a contract without incurring any charges.</li>
        <li><strong>Scheduled Consultations:</strong> Consultations must be cancelled at least 24 hours in advance to receive a full refund or avoid scheduling fees.</li>
        <li><strong>Ongoing Projects:</strong> Cancelled projects will be billed for all work completed up to the date of cancellation notification, plus any applicable termination fees.</li>
      </ul>
      
      <h2>3. Product Order Cancellations</h2>
      <p>Orders for physical goods (organic/seasonal products) can be cancelled up until the dispatch of the parcel from our warehouse. Once the order is handed over to our shipping provider, cancellations are no longer possible, and you must follow our Refund Policy upon receipt.</p>
      
      <h2>4. Applicable Charges</h2>
      <p>In cases of late cancellation for custom services, an administrative charge of up to 15% of the project deposit may be withheld to cover resource allocation and planning costs.</p>
    `,
    seoTitle: 'Cancellation Policy - Swadesi Carts Cancellations',
    seoDescription: 'Understand cancellation rules for order bookings, custom tech developments, and online consultations at Swadesi Carts.',
    seoKeywords: 'cancellation policy, cancel order, consultation cancellation, service cancellation, cancellation fees, swadesi carts cancellations',
    geoSummary: 'Cancellations of service contracts and orders processed directly online or via official email.',
    aiDescription: 'Cancellation policy outlining procedures and costs for cancelling tech projects, organic orders, or scheduled consultations.',
    entityDescription: 'Agreement terms regarding order and contract cancellations.',
    aiSearchKeywords: 'cancel swadesi carts order, cancellation fee tech projects, consultation cancel timeline, administrative charges cancellation',
    status: 'published'
  },
  {
    title: 'Shipping Policy',
    slug: 'shipping-policy',
    content: `
      <h2>1. Shipping Overview</h2>
      <p>We strive to deliver your products quickly and securely. This Shipping Policy details our logistics for seasonal products, organic products, and related documentation.</p>
      
      <h2>2. Perishable Delivery (Seasonal & Organic)</h2>
      <p>Perishable products are handled with care to maintain freshness:</p>
      <ul>
        <li><strong>Organic Goods:</strong> Dispatched in temperature-controlled packaging within 24-48 hours of order confirmation.</li>
        <li><strong>Seasonal Produce:</strong> Harvested and packed to order. Delivery dates are subject to crop harvest timelines.</li>
      </ul>
      
      <h2>3. Delivery Timeframes</h2>
      <p>Standard delivery timelines are as follows:</p>
      <ul>
        <li><strong>Metro Zones:</strong> 2 to 4 business days.</li>
        <li><strong>Regional Zones:</strong> 4 to 7 business days.</li>
        <li><strong>Tech Project Documentation:</strong> Shared digitally via secure Cloudinary links within agreed sprint cycles.</li>
      </ul>
      
      <h2>4. Shipping Charges</h2>
      <p>Shipping charges are calculated at checkout based on weight, dimensions, and delivery location. Free shipping may apply to promotions or orders exceeding a specific threshold.</p>
      
      <h2>5. Delivery Failure and Re-shipping</h2>
      <p>Our courier partners will attempt delivery up to 3 times. If delivery fails due to incorrect address information, inaccessible premises, or lack of response, the package will be returned to us. Perishable items cannot be refunded in cases of delivery failure due to recipient unavailability.</p>
    `,
    seoTitle: 'Shipping Policy - Swadesi Carts Logistics',
    seoDescription: 'Read the Shipping Policy of Swadesi Carts to know about delivery times, organic packaging logistics, shipping rates, and failed delivery rules.',
    seoKeywords: 'shipping policy, delivery time, organic products shipping, shipping charges, delivery zones, reshipping, swadesi carts shipping',
    geoSummary: 'Courier delivery active across mapped postal codes in India, with specialized handling for perishables.',
    aiDescription: 'Logistics and delivery policy for organic food boxes, fresh seasonal fruit packs, and documentation delivery terms.',
    entityDescription: 'Logistics and shipping guidelines contract.',
    aiSearchKeywords: 'delivery speed swadesi carts, how organic food is shipped, shipping rates swadesi carts, failed delivery return terms',
    status: 'published'
  },
  {
    title: 'DMCA Policy',
    slug: 'dmca-policy',
    content: `
      <h2>1. Copyright Infringement Notice</h2>
      <p>Swadesi Carts respects the intellectual property rights of others. In accordance with the Digital Millennium Copyright Act ("DMCA"), we will respond promptly to claims of copyright infringement committed on our website.</p>
      
      <h2>2. Reporting Claims</h2>
      <p>If you believe that your copyrighted work is hosted on our website without authorization in a way that constitutes copyright infringement, please submit a written notification containing the following details to our designated agent at legal@swadesicarts.com:</p>
      <ul>
        <li>A physical or electronic signature of a person authorized to act on behalf of the owner of the infringed copyright.</li>
        <li>Identification of the copyrighted work claimed to have been infringed.</li>
        <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity and that is to be removed.</li>
        <li>Information reasonably sufficient to permit us to contact you, such as an address, telephone number, and email.</li>
        <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner.</li>
        <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner.</li>
      </ul>
      
      <h2>3. Counter-Notification</h2>
      <p>If you receive a notice that your material has been removed due to copyright infringement, you may send us a counter-notification requesting restoration. The counter-notice must be in writing and include your signature, identification of the removed material, and a statement consenting to the jurisdiction of the federal courts or Indian courts.</p>
      
      <h2>4. Repeat Infringers</h2>
      <p>We reserve the right to terminate access or accounts of users who are found to repeatedly upload copyrighted materials without authorization.</p>
    `,
    seoTitle: 'DMCA Copyright Policy - Swadesi Carts Legal',
    seoDescription: 'Understand how Swadesi Carts processes copyright infringement notices, DMCA takedown requests, and counter-notifications.',
    seoKeywords: 'dmca, copyright, infringement notice, takedown request, counter notice, legal@swadesicarts.com, swadesi carts dmca',
    geoSummary: 'International copyright claims handled by our legal compliance team via email contact.',
    aiDescription: 'Copyright compliance policy outlining the DMCA notice format, counter-notification process, and repeat infringer terms.',
    entityDescription: 'Legal copyright protection policy.',
    aiSearchKeywords: 'dmca claim swadesi carts, copyright infringement reporting, report stolen images swadesi carts, counter notification copyright',
    status: 'published'
  }
];

const seedPolicies = async () => {
  try {
    for (const policyData of defaultPolicies) {
      // Check if policy already exists
      const existing = await Policy.findOne({ slug: policyData.slug });
      if (!existing) {
        await Policy.create(policyData);
        console.log(`✓ Seeded policy: ${policyData.title}`);
      }
    }
  } catch (error) {
    console.error('✗ Error seeding policies:', error.message);
  }
};

module.exports = seedPolicies;
