function array_eq(a, b) {
	return a.length == b.length && a.every((v, idx) => v == b[idx]);
}

function assign_u64(arr, offset, value) {
	arr[offset + 0] = Number((value >> BigInt(8 * 0)) & BigInt(0xff));
	arr[offset + 1] = Number((value >> BigInt(8 * 1)) & BigInt(0xff));
	arr[offset + 2] = Number((value >> BigInt(8 * 2)) & BigInt(0xff));
	arr[offset + 3] = Number((value >> BigInt(8 * 3)) & BigInt(0xff));
	arr[offset + 4] = Number((value >> BigInt(8 * 4)) & BigInt(0xff));
	arr[offset + 5] = Number((value >> BigInt(8 * 5)) & BigInt(0xff));
	arr[offset + 6] = Number((value >> BigInt(8 * 6)) & BigInt(0xff));
	arr[offset + 7] = Number((value >> BigInt(8 * 7)) & BigInt(0xff));
}

module.exports = {
	array_eq,
	assign_u64
}
