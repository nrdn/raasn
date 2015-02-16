$(document).ready(function() {
	function remove (event) {
		var id  = $(this).attr('id');

		if (confirm(event.data.description)) {
			$.post(event.data.path, {'id': id}).done(function() {
				location.reload();
			});
		}
	}

	$('.rm_post').on('click', {path: '/rm_post', description: 'Удалить пот?'}, remove);
});