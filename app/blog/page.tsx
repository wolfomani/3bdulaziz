'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FireParticles } from '@/components/fire-particles'
import { Search, Calendar, User, Eye, Heart, Share2, Clock, Flame, Code, Cpu, Zap, BookOpen, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  published_date: string
  category: string
  tags: string[]
  featured: boolean
  views: number
  likes: number
  reading_time: number
  image_url?: string
}

const SAMPLE_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'دليل شامل لـ GitHub Copilot: مساعد البرمجة الذكي',
    slug: 'github-copilot-guide',
    excerpt: 'تعرف على كيفية استخدام GitHub Copilot لتحسين إنتاجيتك في البرمجة وكتابة كود أفضل بمساعدة الذكاء الاصطناعي.',
    content: '',
    author: 'Dr X',
    published_date: '2024-01-15',
    category: 'البرمجة',
    tags: ['GitHub', 'AI', 'البرمجة', 'الذكاء الاصطناعي'],
    featured: true,
    views: 1250,
    likes: 89,
    reading_time: 12,
    image_url: '/images/anime1.jpg'
  },
  {
    id: '2',
    title: 'مستقبل الذكاء الاصطناعي في التطوير',
    slug: 'ai-future-development',
    excerpt: 'نظرة على كيف سيغير الذكاء الاصطناعي مجال تطوير البرمجيات في السنوات القادمة.',
    content: '',
    author: 'Dr X',
    published_date: '2024-01-10',
    category: 'الذكاء الاصطناعي',
    tags: ['AI', 'المستقبل', 'التطوير'],
    featured: true,
    views: 980,
    likes: 67,
    reading_time: 8,
    image_url: '/images/anime2.jpg'
  },
  {
    id: '3',
    title: 'أفضل ممارسات تطوير تطبيقات Next.js',
    slug: 'nextjs-best-practices',
    excerpt: 'تعلم أفضل الممارسات لتطوير تطبيقات Next.js عالية الأداء وقابلة للصيانة.',
    content: '',
    author: 'Dr X',
    published_date: '2024-01-05',
    category: 'تطوير الويب',
    tags: ['Next.js', 'React', 'JavaScript'],
    featured: false,
    views: 756,
    likes: 45,
    reading_time: 10,
    image_url: '/images/anime3.jpg'
  },
  {
    id: '4',
    title: 'تحسين أداء قواعد البيانات',
    slug: 'database-optimization',
    excerpt: 'نصائح وتقنيات لتحسين أداء قواعد البيانات وتسريع الاستعلامات.',
    content: '',
    author: 'Dr X',
    published_date: '2024-01-01',
    category: 'قواعد البيانات',
    tags: ['Database', 'Performance', 'SQL'],
    featured: false,
    views: 623,
    likes: 38,
    reading_time: 15,
    image_url: '/images/anime4.jpg'
  }
]

const CATEGORIES = ['الكل', 'البرمجة', 'الذكاء الاصطناعي', 'تطوير الويب', 'قواعد البيانات']

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(SAMPLE_POSTS)
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(SAMPLE_POSTS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('الكل')
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    let filtered = posts

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by category
    if (selectedCategory !== 'الكل') {
      filtered = filtered.filter(post => post.category === selectedCategory)
    }

    // Sort posts
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.published_date).getTime() - new Date(a.published_date).getTime()
        case 'views':
          return b.views - a.views
        case 'likes':
          return b.likes - a.likes
        case 'reading_time':
          return a.reading_time - b.reading_time
        default:
          return 0
      }
    })

    setFilteredPosts(filtered)
  }, [posts, searchTerm, selectedCategory, sortBy])

  const featuredPosts = filteredPosts.filter(post => post.featured)
  const regularPosts = filteredPosts.filter(post => !post.featured)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'البرمجة':
        return <Code className="h-4 w-4" />
      case 'الذكاء الاصطناعي':
        return <Cpu className="h-4 w-4" />
      case 'تطوير الويب':
        return <Zap className="h-4 w-4" />
      case 'قواعد البيانات':
        return <BookOpen className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <FireParticles />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Flame className="h-10 w-10 text-orange-500" />
              <div className="absolute inset-0 h-10 w-10 text-orange-500 animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
              مدونة Dr X
            </h1>
          </div>
          <p className="text-xl text-gray-300 mb-6">
            مقالات تقنية متخصصة في البرمجة والذكاء الاصطناعي
          </p>
          
          {/* Navigation */}
          <div className="flex justify-center gap-4 mb-8">
            <Link href="/">
              <Button variant="outline" className="bg-slate-800/50 border-orange-500/30 text-orange-300 hover:bg-orange-500/20">
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-slate-800/50 border-orange-500/30 backdrop-blur-sm mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في المقالات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-700 border-orange-500/30 text-white placeholder-gray-400 pr-10"
                  dir="rtl"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-slate-700 border-orange-500/30 text-white">
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-orange-500/30">
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category} className="text-white hover:bg-slate-600">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-slate-700 border-orange-500/30 text-white">
                  <SelectValue placeholder="ترتيب حسب" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-orange-500/30">
                  <SelectItem value="date" className="text-white hover:bg-slate-600">الأحدث</SelectItem>
                  <SelectItem value="views" className="text-white hover:bg-slate-600">الأكثر مشاهدة</SelectItem>
                  <SelectItem value="likes" className="text-white hover:bg-slate-600">الأكثر إعجاباً</SelectItem>
                  <SelectItem value="reading_time" className="text-white hover:bg-slate-600">وقت القراءة</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-center text-gray-300">
                <span className="text-sm">
                  {filteredPosts.length} مقال
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-orange-300 mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              المقالات المميزة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredPosts.map(post => (
                <Card key={post.id} className="bg-slate-800/50 border-orange-500/30 backdrop-blur-sm hover:border-orange-500/50 transition-all duration-300 group">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={post.image_url || '/placeholder.svg?height=200&width=400'}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-orange-500 text-white">
                        مميز
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      {getCategoryIcon(post.category)}
                      <Badge variant="outline" className="border-orange-500/30 text-orange-300">
                        {post.category}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-300 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-300 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(post.published_date)}
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.reading_time} دقيقة
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {post.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post.likes}
                        </span>
                      </div>
                      <Link href={`/blog/${post.slug}`}>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                          اقرأ المزيد
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Posts */}
        {regularPosts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-orange-300 mb-6 flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              جميع المقالات
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map(post => (
                <Card key={post.id} className="bg-slate-800/50 border-orange-500/30 backdrop-blur-sm hover:border-orange-500/50 transition-all duration-300 group">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={post.image_url || '/placeholder.svg?height=150&width=300'}
                      alt={post.title}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryIcon(post.category)}
                      <Badge variant="outline" className="border-orange-500/30 text-orange-300 text-xs">
                        {post.category}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-300 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.published_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.reading_time} دقيقة
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.likes}
                        </span>
                      </div>
                      <Link href={`/blog/${post.slug}`}>
                        <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-300 hover:bg-orange-500/20 text-xs">
                          اقرأ
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredPosts.length === 0 && (
          <Card className="bg-slate-800/50 border-orange-500/30 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-orange-500/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">لا توجد مقالات</h3>
              <p className="text-gray-400">لم يتم العثور على مقالات تطابق معايير البحث الخاصة بك.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
