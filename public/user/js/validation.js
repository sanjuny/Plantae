var nameError = document.getElementById('name-error');
var PhoneError = document.getElementById('number-error');
var emailError = document.getElementById('email-error');
var PasswordError = document.getElementById('password-error');  
var submitError = document.getElementById('submit-error');

function validateName(){
    var name = document.getElementById('contact-name').value;      
    if(name.length == 0){
        nameError.innerHTML = 'Name is Required';
        return false;
    }
    if(!name.match(/^[a-zA-z]+\s{1}[a-zA-z]*$/)){   
        nameError.innerHTML = 'Enter full name';
        return false;
    }
    nameError.innerHTML = '';
    return true;


}

function validatePhone(){

    var Phone = document.getElementById('contact-phone').value;
    console.log(Phone);
    if(Phone.length == 0){
        PhoneError.innerHTML = 'Phone no is Required';
        return false;
    }
    if(Phone.length !==10){
        PhoneError.innerHTML = 'Phone no should be 10 digits';
        return false;
    }
    if(!Phone.match(/^[0-9]{10}$/)){     
       PhoneError.innerHTML = 'Phone no is required';
       return false;
    }

    PhoneError.innerHTML = '';
    return true;
}


function validateemail(){

    var email = document.getElementById('contact-email').value;
    console.log(email);

    if(email.length == 0){
        emailError.innerHTML = 'Email is required'
        return false;
    }
    if(!email.match(/^[a-z\._\-[0-9]*[@][A-Za-z]*[\.][a-z]{2,6}$/)){
        emailError.innerHTML = 'email invalid'
        return false;
    }
    if(email == "sanjuny07@gmail.com"){
        emailError.innerHTML = 'you cant use this mail id'
        return false;
    }

    emailError.innerHTML='';
    return true; 

}


function validatePassword(){
    var password = document.getElementById('contact-password').value;


    if(password == ""){
        PasswordError.innerHTML ="Fill the password please!";
        return false;
    }
    if(password.length < 8){
        PasswordError.innerHTML =  "must be atleast 8 characters";
        return false;
    }
  
 
    if(password.length > 15){
        PasswordError.innerHTML = "must not exceed 15 characters";
        return false;
    }
    
    PasswordError.innerHTML = '';
    return true;
}


function validateConfirmPassword(){
    var password = document.getElementById('contact-password').value;
    var confirmPassword = document.getElementById("Confirm-Password").value;
    if(password!= confirmPassword){
        alert("Passwords do not match");
        return false;
    }
    PasswordError.innerHTML = '';
    return true;
}

function validatesubmit(){

    if(!validateName() || !validateemail() || !validatePhone() || !validatePassword() || !validateConfirmPassword()){
        submitError.style.display = 'block';
        submitError.innerHTML = 'please fix error to submit';
        setTimeout(function(){submitError.style.display = 'none';}, 5000);
        return false;
    }
    submitError.innerHTML = '';
    return true;
}





/* for login user validation */


var emailfail = document.getElementById('email-fail');
var passwordfail = document.getElementById('password-fail')


function validateemaill(){

    var email = document.getElementById('contact-emaill').value;
    console.log(email);

    if(email.length == 0){
        emailfail.innerHTML = 'Email is required'
        return false;
    }
    if(!email.match(/^[a-z\._\-[0-9]*[@][A-Za-z]*[\.][a-z]{2,6}$/)){
        emailfail.innerHTML = 'email invalid'
        return false;
    }
    if(email == "sanjuny07@gmail.com"){
        emailfail.innerHTML = 'you cant use this mail id'
        return false;
    }

    emailfail.innerHTML='';
    return true; 

}


function validatePasswordd(){
    var password = document.getElementById('contact-passwordd').value;


    if(password == ""){
        passwordfail.innerHTML ="Fill the password please!";
        return false;
    }
    if(password.length < 8){
        passwordfail.innerHTML =  "must be atleast 8 characters";
        return false;
    }
  
 
    if(password.length > 15){
        passwordfail.innerHTML = "must not exceed 15 characters";
        return false;
    }
    
    passwordfail.innerHTML = '';
    return true;
}

function validatelogin(){

    if(!validateemaill() || !validatePasswordd()){
        submitError.style.display = 'block';
        submitError.innerHTML = 'please fix error to submit';
        setTimeout(function(){submitError.style.display = 'none';}, 5000);
        return false;
    }
    submitError.innerHTML = '';
    return true;
}

