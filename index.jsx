import HelloWorldPage from './client/HelloWorldPage.jsx';
import PostcardPage from './client/PostcardPage.jsx';

var DynamicRoutes = [{
  'name': 'HelloWorldPage',
  'path': '/conversational-ui',
  'component': HelloWorldPage
}];

var SidebarElements = [{
  'primaryText': 'Conversational UI',
  'to': '/conversational-ui',
  'href': '/conversational-ui'
}];

export { SidebarElements, DynamicRoutes, SamplePage, PostcardPage };
