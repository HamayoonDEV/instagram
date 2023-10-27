class CommentDto {
  constructor(comment) {
    this._id = comment._id;
    this.content = comment.content;
    this.blogId = comment.blogId;
    this.authorUsername = comment.author.username;
    this.authorId = comment.author._id;
    this.authorPhotopath = comment.author.photopath;
  }
}
export default CommentDto;
