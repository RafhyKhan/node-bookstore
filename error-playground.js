
const sum = (a, b) => {
    if(a && b) {
        return a + b;
    }

    throw new Error('Invalid arguments');
}

//Best to use Try{}catch{} for Synchronoous Line BY LINE non-requests CODE
//Code after the tryCatch will continue!, it avoids the error, provides alternative route 
try {
    console.log(sum(1));
} catch(error) {
    console.log('Error occured');
    console.log(error);
}