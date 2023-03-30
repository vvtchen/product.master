// shows all products been created in a simple version

async function createProduct(){
    const response = await fetch('/productsCreated');
    const data = await response.json();

    for (product of data){
        /// create a container productInfo to store all product attributes
        const productInfo = document.createElement('div');
        const id = document.createElement('div')
        const image = document.createElement('img');
        const vendor = document.createElement('div');
        const modelNo = document.createElement('div');
        const title = document.createElement('div');
        const vendorPrice = document.createElement('div');
        const sellPrice = document.createElement('div');
        const commissionRate = document.createElement('div')
        ;
        
        
        id.textContent = `Product ID: ${product.id}`;
        vendor.textContent = `Vendor Name: ${product.vendorName}`;
        title.textContent = `Title: ${product.title}`;
        modelNo.textContent = `Model No: ${product.modelNO}`;
        vendorPrice.textContent = `Vendor Price: $${product.vendorPrice}`;
        sellPrice.textContent = `Sell Price: $${product.sellPrice}`;
        commissionRate.textContent = `Commission Rate: ${product.commissionRate}`;
        image.src= product.image_url;

        productInfo.append(image,id, vendor, modelNo, title, vendorPrice, sellPrice, commissionRate);
        document.body.append(productInfo)

    }
    
}
createProduct()


//show all sales record

async function importSales(){
    const response = await fetch('/salesRecord');
    const data = await response.json();

    for (sales of data){
        /// create a container productInfo to store all product attributes
        const salesRecord = document.createElement('div');
        const id = document.createElement('div');
        const product = document.createElement('div');
        const title = document.createElement('div');
        const price = document.createElement('div');
        const units = document.createElement('div');
        const sales_date = document.createElement('div');
        
        id.textContent = `Sales ID: ${sales.sales_id}`;
        product.textContent =`Product ID: ${sales.product_id}`;
        title.textContent = `Title: ${sales.title}`;
        price.textContent =`Price: $${sales.price}`;
        units.textContent =`Units: ${sales.units}`;
        sales_date.textContent =`Date: ${sales.sales_date}`

        salesRecord.append(id, product, title, price, units, sales_date);
        document.body.append(salesRecord)

    }
    
};

importSales()
