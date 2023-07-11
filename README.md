# product.master

## A sales observation and inventory management system that can help multiple small e-commerce owners optimize their sales and purchase.

This project has user authentication which will make business data safe, only people invited by the register account can access the data. Users can easily observe each product’s sales performance, inventory condition, optimize restocking strategy, and track their incoming purchase orders.

- Use JSON web token to verify users. Users can register for their organization and give permission to people they want to share business data with. People without your invitation can’t view your data.
- User registered on the system will create their own data, only users who have your invitation can access your data.
- Each product’s information will include its detail, sales chart, inventory level, price, price margin, price ROI, and history of sales performance.
- Users can add quantities to the shopping cart on the product page. Each product has three different shopping carts and allow users to plan their future restocking orders and maximize the product’s profit by preventing overstock or out-of-stock.
- Includes overall company dashboard which will have overall sales chart, margin, GMS, total purchase amount, inventory status, and profit.
- Each vendor has their own dashboard page, this page will include a sales chart, margin, GMS, top 10 products, inventory status, and purchase status which can support users to make strategies for a specific vendor.
- Includes a product filter function that will allow users to find products by inventory level, current price margin, ROI, product tags, and products that have sales between a specific date.
- Includes invoice verify function that will support users to identify the difference between invoice and corresponding purchase order.
- Includes existing purchase order page that will show the status of the purchase order which supports users to track their purchase orders status.
- Users can import their products, sales, and invoice information by the xlsx template provided on the upload page.

## How to use

1. Register a company account then we will send you an email account verification mail. Once your account is verified you are allowed to log in to the system.
2. You can invite people to join the system, the system will send an invitation link to the user you invite to join you.
   <img width="679" alt="image" src="https://user-images.githubusercontent.com/128115790/232392745-2994e9f2-7a34-4f71-b9c3-07babae5dfd1.png">

3. In order to import data into the system, the first thing need to do is create the vendor information on the create vendor page. Once the system has the vendor info, you can use the xlsx template and import product data into the system on the upload page.
   <img width="611" alt="image" src="https://user-images.githubusercontent.com/128115790/232392851-f6a634da-9cf5-4b15-8f4e-1564684443af.png">
   <img width="644" alt="image" src="https://user-images.githubusercontent.com/128115790/232393484-15f36404-8361-4480-b770-b02040b77e87.png">

4. In order to import invoice data, you will need to make sure you have already made a purchase order, otherwise, you will get an error message. This is to prevent unexpect invoices.
5. In order to upload sales data, you will need to use the sales template on the upload page. While importing sales, the system will find the earliest invoice that still has inventory and calculates the profit for you.

6. Once you import the product into the system, you can change the price, add product tags, and leave a remark comment on the product page.
   <img width="678" alt="image" src="https://user-images.githubusercontent.com/128115790/232392936-685bd3ae-ade0-4816-bb1d-ec43899ee5a3.png">

7. To make a purchase order, you can add quantity to the shopping cart from the product page and check out from the shopping cart page. Each product has 3 different shopping carts and is separated by the vendor.
   <img width="673" alt="image" src="https://user-images.githubusercontent.com/128115790/232393038-130028a4-2c82-44f2-a1b9-88a1a527ec5b.png">

8. You can use the product filter function to find products that have sales between a specific date and monitor your sales, and inventory status, or update the price.
   <img width="468" alt="image" src="https://user-images.githubusercontent.com/128115790/232388242-e76a8d65-3673-46b5-8194-cbd95787282d.png">

9. On the vendor dashboard page. You can monitor each month’s sales performance and inventory level. This page is to support you in making sales goals, purchase plans, and finding an opportunity to grow product sales from this vendor.

## For those who want to clone this project and make your own use

The only thing is to create your own .env file

```
Token_Secret = Your token secret to generate token
mongooseUrl = The URL used to connect to your MongoDB
mysqlUser = MySQL User
mysqlUserPassword = MySQL password
emailPass = Your email password used to send emails from the server
emailAccount = Your email address used to send emails from the server
baseUrl = Your base URL or domain

```

## Demo Account for this application

### Account: demoproject845@gmail.com

### Password: demo123456
