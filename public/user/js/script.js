


function addToCart(proId) {
    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $("#cart-count").html(count)

                let counts = $('#cart-counts').html()
                counts = parseInt(counts) + 1
                $("#cart-counts").html(counts)
            }
        }
    })
}


function changeQuantity(cartId, proId, userId, count) {
    console.log('yeah!! its working');
    let quantity = parseInt(document.getElementById(proId).innerHTML)
    count = parseInt(count)
    $.ajax({
        url: '/change-product-quantity',

        data: {
            cart: cartId,
            product: proId,
            count: count,
            user: userId,
            quantity: quantity
        },
        method: 'post',
        success: (response) => {
            console.log(response.subtotal);
            if (response.removeProduct) {
            } else {
                document.getElementById(proId).innerHTML = quantity + count
                document.getElementById('total').innerHTML = response.total
                document.getElementById('a' + proId).innerHTML = response.subtotal

            }
        }
    })

}

function deleteCartProduct(proId) {
    console.log(proId);
    console.log('kiihh');
    $.ajax({
        url: '/delete-cart-product',

        data: {
            products: proId,
        },
        method:'post',

        success: (response) => {
            if (response.status) {
               swal({
                title:"Good job!",
                text:"Your product is removed form the cart",
                icon:"success",
                button:"ok"

               }).then(()=>{
                location.reload()
               })
            }

        }
    })
}


function addAddress() {
    $.ajax({
        url: '/addaddresscheck',
        method: 'post',
        data: $('#addAddress').serialize(),
        success: (response) => {
            console.log(response,'juuuuuyyy')

        }
    }
    )
}


// function statusUpdate(val,orderId){
//     $.ajax({
//         url:'/admin/updateOrderStatus',
//         data:{
//             status:valu,
//             id:orderId,
//         },
//         method:'post',
//         success:(response)=>{
//             if(response.status){
//                 alert("Status Changed")
//                 location.reload()
//             }else{
//                 console.log('oops');
//             }
//         }
//     })
// }