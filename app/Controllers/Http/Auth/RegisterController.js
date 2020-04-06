'use strict'

const { validateAll } = use('Validator')
const User = use('App/Models/User')
const randomString = require('random-string')
const Mail = use('Mail')

class RegisterController {
  showRegisterForm ({ view }) {
    return view.render('auth.register')
  }

  async register ({ request, session, response }) {
    // Validasyon
    const validation = await validateAll(request.all(), {
      username: 'required|unique:users,username',
      email: 'required|email|unique:users,email',
      password: 'required'
    })

    if (validation.fails()) {
      session.withErrors(validation.messages()).flashExcept(['password'])

      return response.redirect('back')
    }

    // Kullanıcı ekle
    const user = await User.create({
      username: request.input('username'),
      email: request.input('email'),
      password: request.input('password'),
      confirmation_token: randomString({ length: 40 })
    })

    // Doğrulama maili gönder
    await Mail.send('auth.emails.confirm_email', user.toJSON(), message => {
      message
        .to(user.email)
        .from('mkanlioglu@yandex.com')
        .subject('Lütfen e-posta adresinizi doğrulayın.')
    })

    // Başarılı bildirimi
    session.flash({
      notification: {
        type: 'success',
        message: 'Kayıt tamamlandı! E-posta adresinize bir mail gönderildi, lütfen e-posta adresinizi doğrulayın.'
      }
    })

    return response.redirect('/login')
  }

  async confirmEmail ({ params, session, response }) {

    const user = await User.findBy('confirmation_token', params.token)

    
    user.confirmation_token = null
    user.is_active = true

    
    await user.save()

    // Başarılı bildirimi
    session.flash({
      notification: {
        type: 'success',
        message: 'E-posta adresiniz başarıyla doğrulandı.'
      }
    })

    return response.redirect('/login')
  }
}

module.exports = RegisterController
