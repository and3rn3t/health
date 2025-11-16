export type StacLink = {
	title: string | undefined;
	rel: string;
	href: string;
	type?: string;
};

export type StacAsset = {
	href: string;
	type?: string;
	roles?: string[];
	title?: string;
	bands?: Array<{
		name?: string;
		center_wavelength?: number;
		full_width_half_max?: number;
	}>;
};

export type StacGeometry = {
	type: string;
	coordinates: unknown;
};

export type StacItem = {
	type: 'Feature';
	stac_version?: string;
	stac_extensions?: string[];
	id: string;
	bbox: number[];
	geometry: StacGeometry;
	properties: {
		datetime: string;
		start_datetime?: string;
		end_datetime?: string;
		'proj:epsg'?: number | null;
		gsd?: number | null;
		platform?: string | null;
		instruments?: string[] | null;
		[key: string]: unknown;
	};
	links?: StacLink[];
	assets: Record<string, StacAsset>;
	collection?: string;
	[key: string]: unknown;
};

export type StacExtent = {
	spatial: { bbox: number[][] };
	temporal: { interval: Array<[string | null, string | null]> };
};

export type StacProvider = {
	name: string;
	description?: string;
	roles?: string[];
	url?: string;
};

export type StacCollection = {
	type: 'Collection';
	stac_version?: string;
	stac_extensions?: string[];
	id: string;
	title?: string;
	description: string;
	license: string;
	keywords?: string[];
	providers?: StacProvider[];
	extent: StacExtent;
	links: StacLink[];
	summaries?: Record<string, unknown>;
	[key: string]: unknown;
};
