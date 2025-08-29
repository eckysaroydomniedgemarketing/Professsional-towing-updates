# DayBreak Metro - Recovery Billing - QC

1: Pick the VIN from the internal tracking sheet "Post Recovery" - this is already covered. this will be manual input from user as per 'C:\github\professsional-towing-updates\docs\module-plan\module-7-billing-qc-workflow.md' 

2: Search the copied VIN on RDN
URL = 'https://app.recoverydatabase.net/alpha_rdn/module/default/case2/?case_id={CASE_ID}'
here instead of filling the form the system will directly redirect to case page with mentioned url and case id will be get in above step
![Step 2](https://assets.guidejar.com/uploads/6fb2e04e-7f76-4405-854a-5f2ab833f840/c67qHUj1IedfyCjaPnr9oczcJ6p2/b2e5ea52-b2ea-4bc0-8862-62eddca6390e/1755631993090.jpeg)

3: If there are multiple results, open the most recently repossessed case.(NOT NEEDED SKIP THIS STEP)
![Step 3](https://assets.guidejar.com/uploads/6fb2e04e-7f76-4405-854a-5f2ab833f840/c67qHUj1IedfyCjaPnr9oczcJ6p2/801dcfd6-147b-4f3f-ace7-1ce286e12b33/annotated/1756391027984.jpeg)

4: Record the ****order type, client’s name, and lien holder’s name**** These details are needed to determine the repo fee during invoicing (ALREADY COVERED IN MODULE 2)
![Step 4](https://assets.guidejar.com/uploads/6fb2e04e-7f76-4405-854a-5f2ab833f840/c67qHUj1IedfyCjaPnr9oczcJ6p2/bd05b43f-c403-4ce5-9064-3ae5407f8cf4/annotated/1756391027795.jpeg)

5: Check the 'Photos & Docs' tab to make sure all required photos are uploaded properly
Required photos are - Front, Back, Right side, left side, VIN Plate, License plate, Odometer, Front Seat, Back Seat, Glove box, dash board. engine.
REFERENCE 'REVIEW THE CASE PHOTO AND DOCS TEXT FILE TO UNDERSTAND THE HTML STRUCTURE'
**IMPLEMENTATION STATUS: PENDING - Data will be extracted and stored in `case_vehicle_photos` table**
![Step 5](https://assets.guidejar.com/uploads/6fb2e04e-7f76-4405-854a-5f2ab833f840/c67qHUj1IedfyCjaPnr9oczcJ6p2/fbe0c7c1-c7d0-42c7-852d-b3502b5dda3e/annotated/1756391027855.jpeg)

6: Review the substatus to see if there’s any fee request raised for the client(ALREADY IMPLEMENTED THIS STEP AND DATA WILL GET EXTRACT FROM INVOICE TAB/PAGE)
![Step 6](https://assets.guidejar.com/uploads/6fb2e04e-7f76-4405-854a-5f2ab833f840/c67qHUj1IedfyCjaPnr9oczcJ6p2/0d88e1ac-383f-456c-a51d-bc97ff646a3d/annotated/1756391027925.jpeg)

7: Go to the ‘My Summary’ page and check the ‘Additional Information’ section for any pre-approved fees(ALREADY IMPLEMENTED IN MODULE 2 - EXTRACTION)
![Step 7](https://assets.guidejar.com/uploads/6fb2e04e-7f76-4405-854a-5f2ab833f840/c67qHUj1IedfyCjaPnr9oczcJ6p2/ffc7c1bb-efe4-4bf4-9baa-476317d31e7c/1755632788151.jpeg)

8: In the ‘All Updates’ section, review each entry to check for any ‘Fee Request’ or ‘Fee Approval (THIS WILL BE DONE AFTERWARDS SO SKIP FOR NOW)
![Step 8](https://assets.guidejar.com/uploads/6fb2e04e-7f76-4405-854a-5f2ab833f840/c67qHUj1IedfyCjaPnr9oczcJ6p2/9b292717-1d44-47f5-ae60-50d71a116117/annotated/1756391027892.jpeg)

9: In the ‘Updates’ section, you may find multiple fee requests and approvals—such as flatbed/dolly fees, key requests, and mileage charges.(THIS WILL BE DONE AFTERWARDS SO SKIP FOR NOW)
![Step 9](https://assets.guidejar.com/uploads/6fb2e04e-7f76-4405-854a-5f2ab833f840/c67qHUj1IedfyCjaPnr9oczcJ6p2/39f66881-8dba-48d4-9601-a8ac0b16e348/annotated/1756391027824.jpeg)

10: Based on the client’s name, lien holder’s name, and repo type (involuntary, voluntary, or impound), refer to the ‘Client Fee Sheet’ to find the correct fee
https://docs.google.com/document/d/1yteRr51n06n4KzcJ87bfa9iZxwAInHm03aLPN1SGc_w/edit?pli=1&tab=t.0 (THIS WILL BE DONE AFTERWARDS SO SKIP FOR NOW)
![Step 10](https://assets.guidejar.com/uploads/6fb2e04e-7f76-4405-854a-5f2ab833f840/c67qHUj1IedfyCjaPnr9oczcJ6p2/f576e314-d6be-4ca4-b6ed-8b67b533bbaf/annotated/1756391027766.jpeg)

11: Open the ‘Invoice’ tab. (THIS IS ALREADY IMPLEMENTED THE INVOICE EXTRACTION IS DONE IN MODULE 2 SO SKIP)
![Step 11](https://assets.guidejar.com/uploads/6fb2e04e-7f76-4405-854a-5f2ab833f840/c67qHUj1IedfyCjaPnr9oczcJ6p2/3359ffd3-e4cb-410a-ac00-b75bddb254a9/1755633234530.jpeg)

12: Verify that the repo fee and all other approved charges are billed correctly. Also, confirm that the invoice has been sent to the client.(THIS WILL BE DONE AFTERWARDS SO SKIP FOR NOW)
![Step 12](https://assets.guidejar.com/uploads/6fb2e04e-7f76-4405-854a-5f2ab833f840/c67qHUj1IedfyCjaPnr9oczcJ6p2/c385ae82-e783-49c2-8929-bae0473a6901/annotated/1756391027661.jpeg)

13: Open the 'Pay Adjuster' tab and cross-check that the driver's payment matches the calculation in the 'DBM Driver Paycard Calculator' sheet (FOR THIS REFER THE CASE PAY ADJUSTER TEXT FILE FOR REFERENCE AND TO UNDERSTAND THE HTML CODE SO THAT SYSTEM CAN EXTRACT AND STORE THE DATA INTO DATABASE)
https://docs.google.com/spreadsheets/d/1ooi28DE7HBVI75RsZ1sRHdBZhi-KuDRc2rTZEW69fE0/edit?pli=1&gid=758946362#gid=758946362
**IMPLEMENTATION STATUS: PENDING - Data will be extracted and stored in `case_adjuster_payments` table**
![Step 13](https://assets.guidejar.com/uploads/6fb2e04e-7f76-4405-854a-5f2ab833f840/c67qHUj1IedfyCjaPnr9oczcJ6p2/79402395-157f-4522-ad68-f58b562e7f7b/annotated/1756391027955.jpeg)
FOR REFERENCE - - Line 918: <h1 class="section__title">Payment History</h1>
  - Line 919: Start of the payment history table: <table class="table table-striped" id="the_payments">
  - The table contains payment records with:
    - Payment ID (e.g., #21249634, #21249635)
    - Adjuster name (e.g., Oscar Ayala)
    - Amount ($175.00)
    - Type (Tow)
    - Date (08/27/2025)
    - Edit and Delete action buttons

  The payment history table shows the historical payments made to adjusters for this case.
 