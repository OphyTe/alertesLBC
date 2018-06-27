function Article(jsonObject){
  this.title = jsonObject.adview.subject;
  this.id = jsonObject.adview.list_id;
  this.location = jsonObject.adview.location.city_label;
  this.price = parseInt(jsonObject.adview.price[0]);
  this.isPro = jsonObject.adview.owner.type == 'pro' ? true : false;
  this.photosList = jsonObject.adview.images.urls_thumb;
  this.photosNb = jsonObject.adview.images.nb_images;
}