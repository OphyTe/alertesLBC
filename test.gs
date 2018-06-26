function myFunction() {
  var rep = UrlFetchApp.fetch('https://www.leboncoin.fr/jardinage/offres/aquitaine/gironde/?th=1&q=terre').getContentText();
  var startListArticlesTab = rep.indexOf('<ul', rep.indexOf('<section class="tabsContent'));
  var endListArticlesTab = rep.indexOf('</ul>', startListArticlesTab) + 5;
  var data = rep.substring(startListArticlesTab, endListArticlesTab);
  var doc = Xml.parse(data, true);
  var bodyHtml = doc.html.body.toXmlString();
  doc = XmlService.parse(bodyHtml);
  var root = doc.getRootElement();
  var elementList = root.getChildren('li');
  Logger.log('elementList a %s balises <li>', elementList.length);
  Logger.log('namespace : %s', root.getNamespace());
  xml = XmlService.getPrettyFormat().format(doc);
  Logger.log(xml);
  for (var i = 0; i < elementList.length; i++) {
    var artUrl = elementList[i].getChild('a').getAttribute('href');
    var imgSrc = elementList[i].getChild('a').getChild('div').getChild('span').getChild('span').getChild('img').getAttribute('src');
    var title = elementList[i].getChild('a').getChild('section').getChild('h2').getText();
    Logger.log('%s - %s - %s', title, artUrl, imgSrc)
  }
}
