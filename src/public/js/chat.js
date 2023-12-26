let chatBox = document.getElementById('chatbox')

Swal.fire({
    title: 'Authentication',
    input: 'text',
    text: 'Set username for the chat',
    inputValidator: (value) => {
        return !value.trim() && 'Please. Write a username!'
    },
    allowOutsideClick: false
}).then( (result) => {
    user = result.value
    document.getElementById('user').innerHTML = `<b>${user}</b>`
    let socket = io()

    chatBox.addEventListener('keyup', (event) => {
        if(event.key == 'Enter'){
            if(chatBox.value.trim().length > 0){
                let newMessage = {
                    user,
                    message: chatBox.value
                }
                socket.emit('message', newMessage)
                chatBox.value = ''
            }
        }
    })

    socket.on('logs', (data) => {
        const divLogs = document.getElementById('messagesLogs')
        let messages = ''
        data.reverse().forEach( (message) => {
            messages += `
                <div class='bg-secondary p-2 my-2 rounded-2'>
                    <p><i>${message.user}</i>: ${message.message}</p>
                </div>
            `
        })
        divLogs.innerHTML = messages
    })

    socket.on('alerta', () => {
        Toastify({
            text: 'Nuevo usuario conectado',
            duration: 1500,
            newWindow: true,
            close: true,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: {
                background: "#7dd56f",
                background: "-webkit-linear-gradient(to right, #28b487, #7dd56f)",
                background: "linear-gradient(to right, #28b487, #7dd56f)",
            },
            onClick: function () {},
        }).showToast()
    })
})