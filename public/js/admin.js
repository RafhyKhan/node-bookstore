
//We are making Asynchronous Javascript Requests (fetch and send datat without having to reload page or redirect())


//we put this in parameter when calling function from EJS file
//now we can get prarmaeter btn
//with this we can get the other variables in that EJS file asWELL

const deleteProduct = (btn) => {

    console.log('Clicked!');
    //we are getting other variables in that EJS file with button
    const prodId = btn.parentNode.querySelector('[name=productId]').value; //gives us productId variable value
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value //gives csrf token value
    
    //now we want it to delet without having to reload page
    const productElement = btn.closest('article'); //gets article ejs component closest to btn


    /*
    We are deleting the product with this fetch function, and giving csrf token just incase!
    Fetch has a special case for headers for CSRF
    */
    fetch('/admin/product/' + prodId, {
        method: 'DELETE',
        headers: {
            'csrf-token' : csrf
        }
    })
    .then(result => {
        return result.json();
    })
    .then(data => {
        console.log(data);
        productElement.parentNode.removeChild(productElement); //removing DOM element in real time
    })
    .catch(err => {
        console.log(err);
    })



}