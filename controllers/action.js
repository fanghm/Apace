exports.index = function(req, res, next) {
  var aps = [
    {
      title: 'Kickoff Apace project',
      status: 'Done',
      owner: 'Frank',
      addDate: 'August 17th 2016'
    },
    {
      title: 'Read Handlebars template engine documents',
      status: 'Ongoing',
      owner: 'Tony',
      addDate: 'August 18th 2016'
    }
  ];

  res.render('action', {actions: aps});
};