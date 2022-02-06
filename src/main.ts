import { QueryParams } from './helpers'
import './main.scss'
import view from './View'
import { renderPage } from './preview'

view(QueryParams.get())
renderPage('https://github.com/daviskeene/Portfolio')
